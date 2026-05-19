'use strict';

(() => {
  const params = new URLSearchParams(location.search);
  const IS_SHOWCASE = params.get('showcase') === '1' || params.get('embed') === '1';
  const IS_EMBED = params.get('embed') === '1';

  const ECON = { perPlay: 0.024, album: 9.71 };

  const DEMO_MP3 = 'demo/complicated.mp3';
  const DEMO_COVER = 'demo/complicated-cover.png';

  const wallet = {
    session: 0,
    lastTrackId: null,
    events: [],
  };

  const DEMO = [
    {
      url: DEMO_MP3,
      cover: DEMO_COVER,
      title: 'Complicated',
      artist: 'Computer Machine',
      album: 'Complicated',
    },
  ];

  const $ = (s) => document.querySelector(s);
  const audio = $('#audio');
  const el = {
    add: $('#btn-add'),
    demo: $('#btn-demo'),
    file: $('#file-input'),
    play: $('#btn-play'),
    prev: $('#btn-prev'),
    next: $('#btn-next'),
    seek: $('#seek'),
    seekFill: $('#seek-fill'),
    timeCur: $('#time-cur'),
    timeRem: $('#time-remaining'),
    title: $('#track-title'),
    sub: $('#track-sub'),
    awName: $('#aw-name'),
    awTag: $('#aw-tag'),
    awThis: $('#aw-this-play'),
    awSession: $('#aw-session'),
    awFeed: $('#aw-feed'),
    awAvatar: $('#aw-avatar'),
    artImg: $('#art-img'),
    artWrap: $('#art-wrap'),
    artBuffer: $('#art-buffer'),
    toast: $('#toast'),
    viz: $('#viz'),
    shuffle: $('#btn-shuffle'),
    repeat: $('#btn-repeat'),
    skipBack: $('#btn-skip-back'),
    skipFwd: $('#btn-skip-fwd'),
    mute: $('#btn-mute'),
    volume: $('#volume'),
    speed: $('#speed'),
    queueBtn: $('#btn-queue'),
    queuePanel: $('#queue-panel'),
    queueList: $('#queue-list'),
    queueClose: $('#btn-queue-close'),
    fullscreen: $('#btn-fullscreen'),
    shortcuts: $('#btn-shortcuts'),
    shortcutsDlg: $('#shortcuts-dialog'),
    shortcutsClose: $('#btn-shortcuts-close'),
    playSpinner: $('#play-spinner'),
    appRoot: $('#app-root'),
    statusPill: $('#status-pill'),
  };

  let queue = [];
  let idx = -1;
  let objectUrl = null;
  let wavUrl = null;
  let raf = 0;
  let loadedTrackId = null;
  let loadGen = 0;
  let suppressErrorToast = false;
  const PEAK_BARS = 1200;
  const peakCache = new Map();
  let waveformDragging = false;
  let shuffleOn = false;
  let repeatMode = 'off';
  let volumeBeforeMute = 1;
  let resumeMap = {};
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  function assetUrl(rel) {
    return new URL(rel, window.location.href).href;
  }

  function needsSourceFor(t) {
    if (!t) return true;
    return loadedTrackId !== t.id;
  }

  function audioErrorMessage() {
    const code = audio.error && audio.error.code;
    if (code === 1) return 'Playback aborted';
    if (code === 2) return 'Network error — use a local server (see README)';
    if (code === 3) return 'Decode error — file may be corrupt';
    if (code === 4) return 'Format not supported';
    return 'Could not load audio file';
  }

  function fmtUsd(n) {
    return '$' + (Math.round(n * 100) / 100).toFixed(2);
  }
  function fmtPlus(n) {
    return '+ ' + fmtUsd(n);
  }
  function fmtTime(s) {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + String(sec).padStart(2, '0');
  }
  function fmtTimeRemaining(s) {
    if (!isFinite(s) || s < 0) return '−0:00';
    return '−' + fmtTime(s);
  }

  function loadPrefs() {
    try {
      const v = sessionStorage.getItem('encore.volume');
      if (v != null) {
        const n = Math.max(0, Math.min(1, Number(v)));
        if (isFinite(n)) {
          audio.volume = n;
          volumeBeforeMute = n || 1;
          if (el.volume) el.volume.value = String(Math.round(n * 100));
        }
      }
      const spd = sessionStorage.getItem('encore.speed');
      if (spd && el.speed) {
        audio.playbackRate = Number(spd) || 1;
        el.speed.value = spd;
      }
      const raw = sessionStorage.getItem('encore.resume');
      if (raw) resumeMap = JSON.parse(raw) || {};
    } catch (_) { /* sessionStorage unavailable */ }
  }

  function savePrefs() {
    try {
      sessionStorage.setItem('encore.volume', String(audio.volume));
      sessionStorage.setItem('encore.speed', String(audio.playbackRate));
      sessionStorage.setItem('encore.resume', JSON.stringify(resumeMap));
    } catch (_) { /* noop */ }
  }

  function setBuffering(on) {
    document.body.classList.toggle('is-buffering', on);
    if (el.artBuffer) el.artBuffer.hidden = !on;
    updateStatusPill();
  }

  function updateVolumeUI() {
    const pct = Math.round(audio.volume * 100);
    if (el.volume) el.volume.value = String(pct);
    if (el.mute) {
      el.mute.textContent = audio.muted || audio.volume === 0 ? '⊘' : '♪';
      el.mute.setAttribute('aria-label', audio.muted ? 'Unmute' : 'Mute');
    }
  }

  function updateRepeatUI() {
    if (!el.repeat) return;
    el.repeat.dataset.mode = repeatMode;
    el.repeat.classList.toggle('is-active', repeatMode !== 'off');
    const labels = { off: 'Repeat off', one: 'Repeat one', all: 'Repeat all' };
    el.repeat.setAttribute('aria-label', labels[repeatMode] || labels.off);
    el.repeat.classList.toggle('ptool-repeat', repeatMode === 'one');
    el.repeat.textContent = repeatMode === 'one' ? 'Repeat 1' : 'Repeat';
  }

  function updateShuffleUI() {
    if (!el.shuffle) return;
    el.shuffle.setAttribute('aria-pressed', shuffleOn ? 'true' : 'false');
    el.shuffle.classList.toggle('is-active', shuffleOn);
    el.shuffle.setAttribute('aria-label', shuffleOn ? 'Shuffle on' : 'Shuffle off');
    el.shuffle.textContent = shuffleOn ? 'Shuffling' : 'Shuffle';
  }

  function cycleRepeat() {
    repeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    updateRepeatUI();
  }

  function seekRelative(sec) {
    if (!isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + sec));
    flashSeek();
  }

  function flashSeek() {
    if (!el.artWrap) return;
    el.artWrap.classList.add('is-seek-flash');
    clearTimeout(flashSeek._t);
    flashSeek._t = setTimeout(() => el.artWrap.classList.remove('is-seek-flash'), 140);
  }

  function pickNextIndex() {
    if (!queue.length) return -1;
    if (queue.length === 1) return 0;
    if (!shuffleOn) return (idx + 1) % queue.length;
    let n = idx;
    while (n === idx) n = Math.floor(Math.random() * queue.length);
    return n;
  }

  function pickPrevIndex() {
    if (!queue.length) return -1;
    if (!shuffleOn) return (idx - 1 + queue.length) % queue.length;
    let n = idx;
    while (n === idx) n = Math.floor(Math.random() * queue.length);
    return n;
  }

  function onTrackEnded() {
    document.body.classList.remove('is-playing');
    if (!queue.length) return;
    if (repeatMode === 'one') {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    if (repeatMode === 'all' || idx < queue.length - 1 || shuffleOn) {
      playAt(pickNextIndex());
      return;
    }
  }

  function renderQueue() {
    if (!el.queueList) return;
    while (el.queueList.firstChild) el.queueList.removeChild(el.queueList.firstChild);
    queue.forEach((t, i) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'queue-item' + (i === idx ? ' is-current' : '');
      const num = document.createElement('span');
      num.className = 'queue-item-num';
      num.textContent = String(i + 1);
      const meta = document.createElement('span');
      meta.className = 'queue-item-meta';
      const title = document.createElement('span');
      title.className = 'queue-item-title';
      title.textContent = t.title || 'Untitled';
      const artist = document.createElement('span');
      artist.className = 'queue-item-artist';
      artist.textContent = t.artist || 'Unknown';
      meta.appendChild(title);
      meta.appendChild(artist);
      btn.appendChild(num);
      btn.appendChild(meta);
      btn.addEventListener('click', () => playAt(i));
      li.appendChild(btn);
      el.queueList.appendChild(li);
    });
    notifyEmbedHeight();
  }

  function toggleQueue(open) {
    if (!el.queuePanel) return;
    const show = open != null ? open : el.queuePanel.hidden;
    el.queuePanel.hidden = !show;
    if (el.queueBtn) el.queueBtn.setAttribute('aria-expanded', show ? 'true' : 'false');
    if (show) renderQueue();
    notifyEmbedHeight();
  }

  function saveResumePosition() {
    const t = currentTrack();
    if (!t || !t.id || !isFinite(audio.duration) || audio.currentTime < 3) return;
    if (audio.duration - audio.currentTime < 5) {
      delete resumeMap[t.id];
    } else {
      resumeMap[t.id] = audio.currentTime;
    }
    savePrefs();
  }

  function restoreResumePosition(t) {
    if (!t || !t.id) return;
    const pos = resumeMap[t.id];
    if (pos != null && isFinite(audio.duration) && pos < audio.duration - 2) {
      audio.currentTime = pos;
    }
  }
  function toast(msg) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.toast.classList.remove('show'), 4000);
  }

  function walletRender() {
    const t = queue[idx >= 0 ? idx : 0];
    const name = (t && t.artist) ? t.artist : 'Computer Machine';
    el.awName.textContent = name;
    el.awTag.textContent = t && t.album ? t.album : 'Complicated · Encore demo';
    el.awThis.textContent = fmtPlus(ECON.perPlay);
    el.awSession.textContent = fmtUsd(wallet.session);
    while (el.awFeed.firstChild) el.awFeed.removeChild(el.awFeed.firstChild);
    wallet.events.slice(0, 4).forEach((e) => {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = fmtPlus(e.amt);
      li.appendChild(strong);
      li.appendChild(document.createTextNode(e.label));
      el.awFeed.appendChild(li);
    });
  }

  function walletPush(label, amt) {
    wallet.events.unshift({ label, amt });
    if (wallet.events.length > 8) wallet.events.length = 8;
    wallet.session += amt;
    walletRender();
    el.awThis.classList.remove('pulse');
    void el.awThis.offsetWidth;
    el.awThis.classList.add('pulse');
  }

  function creditPlay(t) {
    if (!t || wallet.lastTrackId === t.id) return;
    wallet.lastTrackId = t.id;
    walletPush('Verified play · ' + (t.title || 'track'), ECON.perPlay);
  }

  function setCoverArt(url) {
    if (!el.artImg) return;
    const src = url ? (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('file:') ? url : assetUrl(url)) : '';
    if (src) {
      el.artImg.src = src;
      el.artImg.hidden = false;
      if (el.awAvatar) {
        el.awAvatar.classList.add('has-cover');
        el.awAvatar.style.backgroundImage = 'url("' + src + '")';
      }
    } else {
      el.artImg.removeAttribute('src');
      el.artImg.hidden = true;
      if (el.awAvatar) {
        el.awAvatar.classList.remove('has-cover');
        el.awAvatar.style.backgroundImage = '';
      }
    }
  }

  function updateStatusPill() {
    if (!el.statusPill) return;
    if (document.body.classList.contains('is-buffering')) {
      el.statusPill.textContent = 'Loading';
    } else if (!audio.paused && !audio.ended) {
      el.statusPill.textContent = 'Playing';
    } else if (queue.length && idx >= 0) {
      el.statusPill.textContent = 'Paused';
    } else {
      el.statusPill.textContent = 'Ready';
    }
  }

  function updateTitleMarquee() {
    if (!el.title) return;
    const text = el.title.textContent || '';
    el.title.classList.toggle('is-long', text.length > 22);
  }

  function updateUI() {
    const t = idx >= 0 ? queue[idx] : (queue[0] || null);
    if (!t) {
      el.title.textContent = 'Choose a track';
      el.sub.textContent = 'Press play for the demo · or add your own files';
      setCoverArt(DEMO_COVER);
      updateTitleMarquee();
      walletRender();
      updateStatusPill();
      return;
    }
    el.title.textContent = t.title || 'Untitled';
    el.sub.textContent = [t.artist, t.album].filter(Boolean).join(' · ') || 'Local file';
    setCoverArt(t.cover || null);
    updateTitleMarquee();
    walletRender();
    updateStatusPill();
  }

  function revokeUrls() {
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    if (wavUrl) { URL.revokeObjectURL(wavUrl); wavUrl = null; }
  }

  function waitForReady(media, gen) {
    return new Promise((resolve, reject) => {
      if (gen !== loadGen) {
        reject(new Error('cancelled'));
        return;
      }
      if (media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !media.error) {
        resolve();
        return;
      }
      const onReady = () => {
        if (gen !== loadGen) { cleanup(); reject(new Error('cancelled')); return; }
        if (media.error) { cleanup(); reject(new Error('decode')); return; }
        cleanup();
        resolve();
      };
      const onErr = () => {
        cleanup();
        reject(new Error('decode'));
      };
      const cleanup = () => {
        clearTimeout(timer);
        media.removeEventListener('loadeddata', onReady);
        media.removeEventListener('canplay', onReady);
        media.removeEventListener('canplaythrough', onReady);
        media.removeEventListener('error', onErr);
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('timeout'));
      }, 20000);
      media.addEventListener('loadeddata', onReady, { once: true });
      media.addEventListener('canplay', onReady, { once: true });
      media.addEventListener('canplaythrough', onReady, { once: true });
      media.addEventListener('error', onErr, { once: true });
    });
  }

  async function aiffToWav(file) {
    const buf = await file.arrayBuffer();
    const u8 = new Uint8Array(buf);
    const dv = new DataView(buf);
    if (String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) !== 'FORM') return null;
    let pos = 12;
    let numChannels = 0;
    let numFrames = 0;
    let bits = 0;
    let rate = 44100;
    let encoding = 'NONE';
    let soundData = null;
    while (pos + 8 <= u8.length) {
      const id = String.fromCharCode(u8[pos], u8[pos + 1], u8[pos + 2], u8[pos + 3]);
      const size = dv.getUint32(pos + 4, false);
      const dataStart = pos + 8;
      if (id === 'COMM') {
        numChannels = dv.getUint16(dataStart, false);
        numFrames = dv.getUint32(dataStart + 2, false);
        bits = dv.getUint16(dataStart + 6, false);
        encoding = String.fromCharCode(u8[dataStart + 8], u8[dataStart + 9], u8[dataStart + 10], u8[dataStart + 11]).replace(/\0/g, '');
        rate = 44100;
      } else if (id === 'SSND') {
        const offset = dv.getUint32(dataStart, false);
        const block = dv.getUint32(dataStart + 4, false);
        soundData = u8.subarray(dataStart + 8 + offset + block, dataStart + size);
      }
      pos = dataStart + size + (size & 1);
    }
    if (!soundData || !numChannels || !bits) return null;
    const bytesPerSample = bits / 8;
    const pcm = new Uint8Array(soundData.length);
    pcm.set(soundData);
    if (encoding === 'sowt' || encoding === 'NONE' || encoding === 'twos') {
      if (bits === 16) {
        for (let i = 0; i < pcm.length; i += 2) {
          const t = pcm[i]; pcm[i] = pcm[i + 1]; pcm[i + 1] = t;
        }
      }
    }
    const dataLen = numFrames * numChannels * bytesPerSample;
    const out = new ArrayBuffer(44 + dataLen);
    const o = new DataView(out);
    const w = (p, s) => { for (let i = 0; i < s.length; i++) o.setUint8(p + i, s.charCodeAt(i)); };
    w(0, 'RIFF');
    o.setUint32(4, 36 + dataLen, true);
    w(8, 'WAVE');
    w(12, 'fmt ');
    o.setUint32(16, 16, true);
    o.setUint16(20, 1, true);
    o.setUint16(22, numChannels, true);
    o.setUint32(24, rate, true);
    o.setUint32(28, rate * numChannels * bytesPerSample, true);
    o.setUint16(32, numChannels * bytesPerSample, true);
    o.setUint16(34, bits, true);
    w(36, 'data');
    o.setUint32(40, dataLen, true);
    new Uint8Array(out, 44).set(pcm.subarray(0, dataLen));
    return new Blob([out], { type: 'audio/wav' });
  }

  async function setSource(t) {
    const gen = ++loadGen;
    suppressErrorToast = true;
    revokeUrls();
    audio.pause();

    let src;
    if (t.file) {
      const ext = (t.file.name.split('.').pop() || '').toLowerCase();
      if (ext === 'aiff' || ext === 'aif') {
        const wav = await aiffToWav(t.file);
        if (wav) {
          wavUrl = URL.createObjectURL(wav);
          src = wavUrl;
        } else {
          objectUrl = URL.createObjectURL(t.file);
          src = objectUrl;
        }
      } else {
        objectUrl = URL.createObjectURL(t.file);
        src = objectUrl;
      }
    } else {
      src = assetUrl(t.url);
    }

    audio.src = src;
    audio.load();
    await waitForReady(audio, gen);
    loadedTrackId = t.id;
    suppressErrorToast = false;
    void loadPeaksForTrack(t);
  }

  function seedDemoPeaks(t) {
    if (!t || t.id !== 'demo-0') return;
    const raw = window.ENCORE_DEMO_PEAKS;
    if (!raw || !raw.length) return;
    const peaks = Float32Array.from(raw);
    t.peaks = peaks;
    peakCache.set(t.id, peaks);
  }

  function peaksFromAudioBuffer(buffer, bars) {
    const ch = buffer.getChannelData(0);
    const len = ch.length;
    const block = Math.max(1, Math.floor(len / bars));
    const peaks = new Float32Array(bars);
    let max = 0;
    for (let i = 0; i < bars; i++) {
      let peak = 0;
      const start = i * block;
      const end = Math.min(len, start + block);
      for (let j = start; j < end; j++) {
        const a = Math.abs(ch[j]);
        if (a > peak) peak = a;
      }
      peaks[i] = peak;
      if (peak > max) max = peak;
    }
    if (max > 0) {
      for (let i = 0; i < bars; i++) peaks[i] /= max;
    }
    return peaks;
  }

  function currentTrack() {
    return idx >= 0 ? queue[idx] : (queue[0] || null);
  }

  function peaksForTrack(t) {
    if (!t) return null;
    return t.peaks || peakCache.get(t.id) || null;
  }

  async function loadPeaksForTrack(t) {
    if (!t || !t.id) return;
    if (peakCache.has(t.id)) {
      t.peaks = peakCache.get(t.id);
      return;
    }
    seedDemoPeaks(t);
    if (t.peaks) return;

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      let arrayBuffer;
      if (t.file) {
        arrayBuffer = await t.file.arrayBuffer();
      } else if (audio.src) {
        const res = await fetch(audio.src);
        if (!res.ok) throw new Error('fetch');
        arrayBuffer = await res.arrayBuffer();
      } else {
        const res = await fetch(assetUrl(t.url));
        if (!res.ok) throw new Error('fetch');
        arrayBuffer = await res.arrayBuffer();
      }
      const ctx = new Ctx();
      const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
      if (typeof ctx.close === 'function') ctx.close();
      const peaks = peaksFromAudioBuffer(decoded, PEAK_BARS);
      peakCache.set(t.id, peaks);
      t.peaks = peaks;
    } catch (_) {
      seedDemoPeaks(t);
    }
  }

  function resizeVizCanvas(canvas) {
    const g = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width || 400, 280);
    const h = Math.max(rect.height || 72, 72);
    const pw = Math.floor(w * dpr);
    const ph = Math.floor(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g, w, h };
  }

  function peakAt(peaks, t) {
    const n = peaks.length;
    if (n < 2) return peaks[0] || 0;
    const f = Math.max(0, Math.min(1, t)) * (n - 1);
    const i = Math.floor(f);
    const frac = f - i;
    const a = peaks[i];
    const b = peaks[Math.min(i + 1, n - 1)];
    return a + (b - a) * frac;
  }

  function traceWaveform(g, w, h, peaks) {
    const mid = h * 0.5;
    const padY = 3;
    const ampScale = mid - padY;
    const steps = Math.max(2, Math.floor(w));
    g.moveTo(0, mid);
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      const amp = peakAt(peaks, i / steps);
      g.lineTo(x, mid - amp * ampScale);
    }
    for (let i = steps; i >= 0; i--) {
      const x = (i / steps) * w;
      const amp = peakAt(peaks, i / steps);
      g.lineTo(x, mid + amp * ampScale);
    }
    g.closePath();
    return mid;
  }

  function drawWaveform(g, w, h, peaks, progress) {
    const mid = h * 0.5;
    const prog = progress != null && isFinite(progress)
      ? Math.max(0, Math.min(1, progress))
      : null;

    const gradBg = g.createLinearGradient(0, 0, w, 0);
    gradBg.addColorStop(0, 'rgba(250,246,236,0.18)');
    gradBg.addColorStop(1, 'rgba(250,246,236,0.28)');

    g.beginPath();
    traceWaveform(g, w, h, peaks);
    g.fillStyle = gradBg;
    g.fill();

    if (prog != null && prog > 0) {
      g.save();
      g.beginPath();
      g.rect(0, 0, w * prog, h);
      g.clip();
      const gradPlay = g.createLinearGradient(0, 0, w * prog, 0);
      gradPlay.addColorStop(0, 'rgba(52,211,153,0.75)');
      gradPlay.addColorStop(0.5, 'rgba(250,246,236,0.9)');
      gradPlay.addColorStop(1, 'rgba(220,38,38,0.55)');
      g.beginPath();
      traceWaveform(g, w, h, peaks);
      g.fillStyle = gradPlay;
      g.fill();
      g.restore();

      const px = w * prog;
      g.strokeStyle = 'rgba(250,246,236,0.95)';
      g.lineWidth = 2;
      g.shadowColor = 'rgba(52,211,153,0.5)';
      g.shadowBlur = 6;
      g.beginPath();
      g.moveTo(px + 0.5, 0);
      g.lineTo(px + 0.5, h);
      g.stroke();
      g.shadowBlur = 0;
    }

    g.strokeStyle = 'rgba(250,246,236,0.12)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, mid);
    g.lineTo(w, mid);
    g.stroke();
  }

  function waveformProgress() {
    if (!isFinite(audio.duration) || audio.duration <= 0) return 0;
    return audio.currentTime / audio.duration;
  }

  function seekFromWaveform(clientX) {
    const canvas = el.viz;
    if (!canvas || !isFinite(audio.duration) || audio.duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
    const pct100 = Math.round(pct * 100);
    canvas.setAttribute('aria-valuenow', String(pct100));
    if (el.seek) {
      el.seek.setAttribute('aria-valuenow', String(pct100));
      if (el.seekFill) el.seekFill.style.width = pct100 + '%';
    }
    if (el.timeCur) el.timeCur.textContent = fmtTime(audio.currentTime);
  }

  function bindWaveformInteraction() {
    const canvas = el.viz;
    if (!canvas) return;

    const onResize = () => {
      if (el.viz) resizeVizCanvas(el.viz);
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize, { passive: true });
    }

    canvas.addEventListener('pointerdown', (e) => {
      waveformDragging = true;
      canvas.setPointerCapture(e.pointerId);
      seekFromWaveform(e.clientX);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (waveformDragging) seekFromWaveform(e.clientX);
    });
    canvas.addEventListener('pointerup', () => { waveformDragging = false; });
    canvas.addEventListener('pointercancel', () => { waveformDragging = false; });
    canvas.addEventListener('click', (e) => seekFromWaveform(e.clientX));
    canvas.addEventListener('touchstart', (e) => {
      if (e.cancelable) e.preventDefault();
      waveformDragging = true;
      const t = e.changedTouches[0];
      if (t) seekFromWaveform(t.clientX);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      if (!waveformDragging) return;
      if (e.cancelable) e.preventDefault();
      const t = e.changedTouches[0];
      if (t) seekFromWaveform(t.clientX);
    }, { passive: false });
    canvas.addEventListener('touchend', () => { waveformDragging = false; });
    canvas.addEventListener('keydown', (e) => {
      if (!isFinite(audio.duration) || audio.duration <= 0) return;
      const step = e.shiftKey ? 10 : 5;
      if (e.key === 'ArrowRight') {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + step);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        audio.currentTime = Math.max(0, audio.currentTime - step);
        e.preventDefault();
      }
    });
  }

  function drawViz() {
    const canvas = el.viz;
    if (!canvas) return;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const { g, w, h } = resizeVizCanvas(canvas);
      g.clearRect(0, 0, w, h);

      const track = currentTrack();
      const peaks = peaksForTrack(track);
      const progress = isFinite(audio.duration) && audio.duration > 0
        ? waveformProgress()
        : null;

      if (!peaks || peaks.length < 2) {
        const mid = h * 0.5;
        g.strokeStyle = 'rgba(250,246,236,0.15)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(0, mid);
        g.lineTo(w, mid);
        g.stroke();
        return;
      }

      drawWaveform(g, w, h, peaks, progress);
    };
    cancelAnimationFrame(raf);
    loop();
  }

  function playErrorMessage(e) {
    if (e && e.name === 'NotAllowedError') {
      return 'Browser blocked playback — tap Play again';
    }
    if (e && e.message === 'decode') return audioErrorMessage();
    if (e && e.message === 'timeout') return 'Load timed out — check server or network';
    if (e && e.message === 'cancelled') return '';
    return audioErrorMessage();
  }

  async function playAt(i) {
    if (i < 0 || i >= queue.length) return;
    saveResumePosition();
    idx = i;
    const t = queue[i];
    t.id = t.id || 'track-' + i;
    try {
      setBuffering(true);
      if (needsSourceFor(t)) await setSource(t);
      updateUI();
      renderQueue();
      restoreResumePosition(t);
      if (el.speed) audio.playbackRate = Number(el.speed.value) || 1;
      seedDemoPeaks(t);
      void loadPeaksForTrack(t);
      await audio.play();
      setBuffering(false);
      document.body.classList.add('is-playing');
      creditPlay(t);
    } catch (e) {
      setBuffering(false);
      document.body.classList.remove('is-playing');
      loadedTrackId = null;
      const msg = playErrorMessage(e);
      if (msg) toast(msg);
    }
  }

  function loadDemo(autoplay) {
    queue = DEMO.map((d, i) => {
      const track = { ...d, id: 'demo-' + i };
      seedDemoPeaks(track);
      return track;
    });
    idx = queue.length ? 0 : -1;
    loadedTrackId = null;
    updateUI();
    renderQueue();
    if (queue.length) {
      seedDemoPeaks(queue[0]);
      void loadPeaksForTrack(queue[0]);
    }
    if (autoplay && queue.length) playAt(0);
    notifyEmbedHeight();
  }

  function addFiles(files) {
    const added = [];
    for (const f of files) {
      if (!f.type.startsWith('audio/') && !/\.(aiff|aif|mp3|flac|wav|ogg|m4a)$/i.test(f.name)) continue;
      const base = f.name.replace(/\.[^.]+$/, '');
      const parts = base.split(' - ');
      const track = {
        id: 'f-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        file: f,
        url: null,
        title: parts.length > 1 ? parts.slice(1).join(' - ') : base,
        artist: parts.length > 1 ? parts[0] : 'Local file',
      };
      queue.push(track);
      added.push(track);
    }
    if (!added.length) {
      toast('No supported audio files selected');
      return;
    }
    playAt(queue.length - 1);
    renderQueue();
  }

  if (!audio || !el.play) {
    toast('Player failed to initialize');
    return;
  }

  el.add.addEventListener('click', () => el.file.click());
  el.demo.addEventListener('click', () => loadDemo(true));
  el.file.addEventListener('change', (e) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  });

  el.play.addEventListener('click', () => {
    if (!audio.paused) {
      audio.pause();
      document.body.classList.remove('is-playing');
      return;
    }
    playAt(idx >= 0 ? idx : 0);
  });

  el.prev.addEventListener('click', () => { if (queue.length) playAt(pickPrevIndex()); });
  el.next.addEventListener('click', () => { if (queue.length) playAt(pickNextIndex()); });

  if (el.skipBack) el.skipBack.addEventListener('click', () => seekRelative(-10));
  if (el.skipFwd) el.skipFwd.addEventListener('click', () => seekRelative(10));
  if (el.shuffle) el.shuffle.addEventListener('click', () => {
    shuffleOn = !shuffleOn;
    updateShuffleUI();
  });
  if (el.repeat) el.repeat.addEventListener('click', cycleRepeat);
  if (el.mute) {
    el.mute.addEventListener('click', () => {
      if (audio.muted || audio.volume === 0) {
        audio.muted = false;
        audio.volume = volumeBeforeMute || 0.8;
      } else {
        volumeBeforeMute = audio.volume;
        audio.muted = true;
      }
      updateVolumeUI();
      savePrefs();
    });
  }
  if (el.volume) {
    el.volume.addEventListener('input', () => {
      const v = Number(el.volume.value) / 100;
      audio.volume = v;
      audio.muted = v === 0;
      volumeBeforeMute = v || volumeBeforeMute;
      updateVolumeUI();
      savePrefs();
    });
  }
  if (el.speed) {
    el.speed.addEventListener('change', () => {
      audio.playbackRate = Number(el.speed.value) || 1;
      savePrefs();
      toast('Speed ' + el.speed.value + '×');
    });
  }
  if (el.queueBtn) el.queueBtn.addEventListener('click', () => toggleQueue(true));
  if (el.queueClose) el.queueClose.addEventListener('click', () => toggleQueue(false));
  if (el.shortcuts) {
    el.shortcuts.addEventListener('click', () => {
      if (el.shortcutsDlg && typeof el.shortcutsDlg.showModal === 'function') el.shortcutsDlg.showModal();
    });
  }
  if (el.shortcutsClose && el.shortcutsDlg) {
    el.shortcutsClose.addEventListener('click', () => el.shortcutsDlg.close());
  }
  if (el.fullscreen && !IS_EMBED) {
    el.fullscreen.hidden = false;
    el.fullscreen.addEventListener('click', async () => {
      const root = el.appRoot || document.documentElement;
      try {
        if (!document.fullscreenElement) {
          await root.requestFullscreen();
          document.body.classList.add('is-fullscreen');
        } else {
          await document.exitFullscreen();
          document.body.classList.remove('is-fullscreen');
        }
      } catch (_) {
        toast('Fullscreen not available');
      }
    });
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) document.body.classList.remove('is-fullscreen');
    });
  }

  audio.addEventListener('timeupdate', () => {
    const d = audio.duration;
    const c = audio.currentTime;
    if (el.timeCur) el.timeCur.textContent = fmtTime(c);
    if (el.timeRem) el.timeRem.textContent = fmtTimeRemaining(d - c);
    const pct = d > 0 ? (c / d) * 100 : 0;
    if (el.seekFill) el.seekFill.style.width = pct + '%';
    if (el.viz) el.viz.setAttribute('aria-valuenow', String(Math.round(pct)));
  });
  audio.addEventListener('ended', onTrackEnded);
  audio.addEventListener('waiting', () => setBuffering(true));
  audio.addEventListener('canplay', () => setBuffering(false));
  audio.addEventListener('playing', () => setBuffering(false));
  audio.addEventListener('play', () => {
    document.body.classList.add('is-playing');
    updateStatusPill();
  });
  audio.addEventListener('pause', () => {
    document.body.classList.remove('is-playing');
    updateStatusPill();
  });
  audio.addEventListener('error', () => {
    document.body.classList.remove('is-playing');
    loadedTrackId = null;
    if (suppressErrorToast) return;
    toast(audioErrorMessage());
  });

  el.seek.addEventListener('click', (e) => {
    const r = el.seek.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    if (isFinite(audio.duration)) audio.currentTime = pct * audio.duration;
  });

  document.querySelectorAll('.aw-tip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const amt = Number(btn.dataset.tip) || 5;
      walletPush('Tip from @fan_' + Math.floor(Math.random() * 900 + 100), amt);
      toast('Tip ' + fmtUsd(amt) + ' → artist');
    });
  });

  function isTypingTarget(node) {
    if (!node) return false;
    const tag = node.tagName;
    return tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || node.isContentEditable;
  }

  document.addEventListener('keydown', (e) => {
    if (isTypingTarget(e.target)) return;
    const k = e.key;
    if (k === ' ' || k === 'Spacebar') {
      e.preventDefault();
      el.play.click();
    } else if (k === 'm' || k === 'M') {
      el.mute?.click();
    } else if (k === 'ArrowLeft') {
      e.preventDefault();
      seekRelative(e.shiftKey ? -10 : -5);
    } else if (k === 'ArrowRight') {
      e.preventDefault();
      seekRelative(e.shiftKey ? 10 : 5);
    } else if (e.altKey && (k === 'ArrowLeft' || k === 'ArrowRight')) {
      e.preventDefault();
      seekRelative(k === 'ArrowLeft' ? -10 : 10);
    } else if (k === 'ArrowUp') {
      e.preventDefault();
      audio.volume = Math.min(1, audio.volume + 0.05);
      audio.muted = false;
      updateVolumeUI();
      savePrefs();
    } else if (k === 'ArrowDown') {
      e.preventDefault();
      audio.volume = Math.max(0, audio.volume - 0.05);
      updateVolumeUI();
      savePrefs();
    } else if (k === '+' || k === '=') {
      e.preventDefault();
      const i = SPEEDS.indexOf(audio.playbackRate);
      const next = SPEEDS[Math.min(SPEEDS.length - 1, (i < 0 ? 2 : i) + 1)];
      audio.playbackRate = next;
      if (el.speed) el.speed.value = String(next);
      savePrefs();
      toast('Speed ' + next + '×');
    } else if (k === '-' || k === '_') {
      e.preventDefault();
      const i = SPEEDS.indexOf(audio.playbackRate);
      const next = SPEEDS[Math.max(0, (i < 0 ? 2 : i) - 1)];
      audio.playbackRate = next;
      if (el.speed) el.speed.value = String(next);
      savePrefs();
      toast('Speed ' + next + '×');
    } else if (k === 'n' || k === 'N') {
      if (queue.length) playAt(pickNextIndex());
    } else if (k === 'p' || k === 'P') {
      if (queue.length) playAt(pickPrevIndex());
    } else if (k === 's' || k === 'S') {
      el.shuffle?.click();
    } else if (k === 'r' || k === 'R') {
      cycleRepeat();
    } else if (k === 'q' || k === 'Q') {
      toggleQueue(el.queuePanel?.hidden);
    } else if (k === 'f' || k === 'F') {
      if (!IS_EMBED) el.fullscreen?.click();
    } else if (k === 'Escape' && el.shortcutsDlg?.open) {
      el.shortcutsDlg.close();
    }
  });

  if (el.artWrap) {
    let lastTap = 0;
    let lastX = 0;
    el.artWrap.addEventListener('click', (e) => {
      if (e.target.closest('.art-buffer')) return;
      const now = Date.now();
      const rect = el.artWrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const zone = x < rect.width * 0.35 ? 'back' : x > rect.width * 0.65 ? 'fwd' : 'center';
      const isDouble = now - lastTap < 320 && Math.abs(e.clientX - lastX) < 48;
      if (isDouble) {
        if (zone === 'back') seekRelative(-10);
        else if (zone === 'fwd') seekRelative(10);
        lastTap = 0;
        return;
      }
      lastTap = now;
      lastX = e.clientX;
      if (zone === 'center') el.play.click();
    });
  }

  if (IS_SHOWCASE) document.body.classList.add('is-showcase');
  if (IS_EMBED) document.body.classList.add('is-embed');

  loadPrefs();
  updateVolumeUI();
  updateRepeatUI();
  updateShuffleUI();

  let embedHeightTimer = 0;
  function notifyEmbedHeight() {
    if (!IS_EMBED || window.parent === window) return;
    clearTimeout(embedHeightTimer);
    embedHeightTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        window.parent.postMessage(
          { type: 'encore-player-height', height: document.documentElement.scrollHeight },
          '*'
        );
      });
    }, 80);
  }

  if (IS_EMBED) {
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(notifyEmbedHeight).observe(document.documentElement);
    }
    window.addEventListener('load', notifyEmbedHeight);
    window.addEventListener('orientationchange', () => setTimeout(notifyEmbedHeight, 300));
    visualViewport?.addEventListener('resize', notifyEmbedHeight);
  }

  window.addEventListener('beforeunload', saveResumePosition);

  walletRender();
  bindWaveformInteraction();
  drawViz();
  if (IS_SHOWCASE || IS_EMBED) loadDemo(false);
  else renderQueue();
  notifyEmbedHeight();
})();
