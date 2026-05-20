import { useEffect, useState, useCallback, useRef } from "react";
import { useLocalSearchParams, router } from "expo-router";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import { Encore, type ApiTrack, type ApiRelease } from "@encore/sdk";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";
const sdk = new Encore({ baseUrl: API });

function streamUrl(track: ApiTrack): string | null {
  const key = track.hlsKey ?? track.flacKey;
  if (!key) return null;
  return `${API}/media/audio/${encodeURIComponent(key)}`;
}

export default function ReleaseScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [release, setRelease] = useState<ApiRelease | null>(null);
  const [tracks, setTracks] = useState<ApiTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playingIdRef = useRef<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const unloadSound = useCallback(async (): Promise<void> => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    playingIdRef.current = null;
    setPlayingId(null);
  }, []);

  const load = useCallback(async (): Promise<void> => {
    if (!id) return;
    setLoading(true);
    setError(null);
    await unloadSound();
    try {
      const data = await sdk.getRelease(id);
      setRelease(data.release);
      setTracks(data.tracks ?? []);
      setIndex(0);
    } catch {
      setError("Could not load release. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [id, unloadSound]);

  useEffect(() => {
    void load();
    return () => {
      void unloadSound();
    };
  }, [load, unloadSound]);

  const playTrack = useCallback(
    async (track: ApiTrack, trackIndex: number): Promise<void> => {
      const url = streamUrl(track);
      if (!url) return;

      setIndex(trackIndex);

      if (playingIdRef.current === track.id && soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await soundRef.current.pauseAsync();
          setPlayingId(null);
          playingIdRef.current = null;
          return;
        }
      }

      await unloadSound();
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound: s } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      soundRef.current = s;
      playingIdRef.current = track.id;
      setPlayingId(track.id);

      s.setOnPlaybackStatusUpdate((st) => {
        if (!st.isLoaded) return;
        if (st.didJustFinish && trackIndex < tracks.length - 1) {
          const next = tracks[trackIndex + 1];
          if (next) void playTrack(next, trackIndex + 1);
        } else if (st.didJustFinish) {
          void unloadSound();
        }
      });
    },
    [tracks, unloadSound],
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b0b0e" }}>
        <ActivityIndicator color="#dc2626" accessibilityLabel="Loading release" />
      </View>
    );
  }

  if (error || !release) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: "#0b0b0e" }}>
        <Text style={{ color: "#fafafa", fontSize: 17 }} accessibilityRole="alert">
          {error ?? "Not found"}
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ marginTop: 16, minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ color: "#dc2626", fontSize: 16 }}>← Back</Text>
        </Pressable>
      </View>
    );
  }

  const current = tracks[index];
  const isPlaying = current && playingId === current.id;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0b0b0e" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
    >
      <Text style={{ color: "#fafafa", fontSize: 28, fontWeight: "700" }} accessibilityRole="header">
        {release.title}
      </Text>
      <Text style={{ color: "#7a7a85", marginTop: 4, textTransform: "capitalize" }}>{release.type}</Text>

      {current && (
        <Pressable
          onPress={() => void playTrack(current, index)}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? `Pause ${current.title}` : `Play ${current.title}`}
          accessibilityState={{ selected: true }}
          style={{
            marginTop: 20,
            minHeight: 48,
            backgroundColor: "#dc2626",
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
            {isPlaying ? "Pause" : "Play"} · {current.title}
          </Text>
        </Pressable>
      )}

      <Text style={{ color: "#fafafa", fontSize: 18, fontWeight: "600", marginTop: 28 }} accessibilityRole="header">
        Tracks
      </Text>
      {tracks.map((t, i) => (
        <Pressable
          key={t.id}
          onPress={() => void playTrack(t, i)}
          accessibilityRole="button"
          accessibilityState={{ selected: i === index }}
          accessibilityLabel={`Track ${i + 1}: ${t.title}${playingId === t.id ? ", playing" : ""}`}
          style={{
            marginTop: 8,
            padding: 14,
            borderRadius: 12,
            backgroundColor: i === index ? "#2a1a1a" : "#16161b",
            minHeight: 44,
          }}
        >
          <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "600" }}>{t.title}</Text>
          {!streamUrl(t) && (
            <Text style={{ color: "#7a7a85", marginTop: 4, fontSize: 13 }}>
              Transcoding — playback soon
            </Text>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}
