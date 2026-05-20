/**
 * Encore landing — interactions (tabs, scroll reveal, waitlist, player height).
 */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Nav scroll state + mobile menu */
  var nav = document.querySelector(".landing-nav");
  var menu = document.getElementById("nav-menu");
  var toggle = document.getElementById("nav-toggle");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    function closeMenu() {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    document.querySelectorAll(".landing-nav-actions .landing-nav-cta").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }
  if (nav) {
    function onScroll() {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Scroll reveal */
  var reveals = document.querySelectorAll(".landing-reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* How it works tabs */
  var tablist = document.querySelector("[data-landing-tabs]");
  if (tablist) {
    var tabs = tablist.querySelectorAll('[role="tab"]');
    var panels = document.querySelectorAll("[data-landing-panel]");
    function activate(id) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-tab") === id;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) {
        var on = p.getAttribute("data-landing-panel") === id;
        p.classList.toggle("is-active", on);
        if (on) p.removeAttribute("hidden");
        else p.setAttribute("hidden", "");
      });
    }
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        activate(tab.getAttribute("data-tab"));
      });
      tab.addEventListener("keydown", function (e) {
        var idx = Array.prototype.indexOf.call(tabs, tab);
        if (e.key === "ArrowRight") {
          e.preventDefault();
          tabs[(idx + 1) % tabs.length].focus();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          tabs[(idx - 1 + tabs.length) % tabs.length].focus();
        }
      });
    });
    tabs.forEach(function (t) {
      t.addEventListener("focus", function () {
        activate(t.getAttribute("data-tab"));
      });
    });
    if (!reduced) {
      var auto = 0;
      var ids = ["listen", "pay", "own"];
      setInterval(function () {
        if (document.hidden) return;
        auto = (auto + 1) % ids.length;
        activate(ids[auto]);
      }, 6000);
    }
  }

  /* Compare highlight on view */
  var compare = document.querySelector(".landing-compare-grid");
  if (compare && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var hi = compare.querySelector(".is-highlight");
            if (hi) hi.classList.add("is-visible");
            cio.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    cio.observe(compare);
  }

  /* Player iframe height */
  var iframe = document.querySelector(".landing-device iframe");
  if (iframe) {
    var best = 0;
    var lockAt = Date.now() + 2000;
    window.addEventListener("message", function (e) {
      if (!e.data || e.data.type !== "encore-player-height") return;
      var h = Math.ceil(Number(e.data.height) + 8);
      if (!h || h < 520 || h > 900) return;
      if (Date.now() > lockAt && h < best) return;
      best = Math.max(best, h);
      iframe.style.height = best + "px";
      iframe.style.minHeight = best + "px";
    });
  }

  /* Smooth in-page anchors */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var href = a.getAttribute("href");
    if (!href || href === "#") return;
    a.addEventListener("click", function (e) {
      var target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      if (history.replaceState) history.replaceState(null, "", href);
    });
  });

  /* Waitlist */
  var form = document.getElementById("waitlist-form");
  if (form) {
    var apiBase = (window.ENCORE_API_BASE || "http://localhost:4000").replace(/\/$/, "");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("waitlist-email").value.trim();
      var role = document.getElementById("waitlist-role").value;
      var status = document.getElementById("waitlist-status");
      status.hidden = false;
      status.textContent = "Sending…";
      fetch(apiBase + "/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, role: role, source: "landing" }),
      })
        .then(function (r) {
          return r.json().then(function (j) {
            return { ok: r.ok, j: j };
          });
        })
        .then(function (res) {
          if (res.ok) {
            status.textContent = "You're on the list.";
            form.reset();
          } else {
            status.textContent =
              res.j && res.j.error ? res.j.error : "Something went wrong — try again.";
          }
        })
        .catch(function () {
          status.textContent = "Can't reach the server right now.";
        });
    });
  }

  /* Pin top on first load (no hash jump) */
  if (!location.hash && "scrollRestoration" in history) {
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }
})();
