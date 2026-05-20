import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, router } from "expo-router";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

interface Artist {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
}

interface Release {
  id: string;
  title: string;
  type: string;
}

export default function ArtistScreen(): JSX.Element {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const aRes = await fetch(`${API}/artists/${slug}`);
      if (!aRes.ok) throw new Error("not_found");
      const aJson = (await aRes.json()) as { artist: Artist };
      setArtist(aJson.artist);
      const rRes = await fetch(`${API}/artists/${slug}/releases`);
      const rJson = rRes.ok
        ? ((await rRes.json()) as { releases: Release[] })
        : { releases: [] };
      setReleases(rJson.releases ?? []);
    } catch {
      setError("Artist not found or API unreachable.");
      setArtist(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b0b0e" }}>
        <ActivityIndicator color="#dc2626" accessibilityLabel="Loading artist" />
      </View>
    );
  }

  if (error || !artist) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: "#0b0b0e" }}>
        <Text style={{ color: "#fafafa" }} accessibilityRole="alert">
          {error ?? "Not found"}
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ marginTop: 16, minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ color: "#dc2626" }}>← Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0b0b0e" }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: "#fafafa", fontSize: 28, fontWeight: "700" }} accessibilityRole="header">
        {artist.name}
      </Text>
      <Text style={{ color: "#7a7a85", marginTop: 4 }}>@{artist.slug}</Text>
      {artist.bio ? (
        <Text style={{ color: "#c0c0ca", marginTop: 16, lineHeight: 22 }}>{artist.bio}</Text>
      ) : null}

      <Text style={{ color: "#fafafa", fontSize: 18, fontWeight: "600", marginTop: 28 }} accessibilityRole="header">
        Releases
      </Text>
      {releases.length === 0 ? (
        <Text style={{ color: "#7a7a85", marginTop: 8 }}>No published releases.</Text>
      ) : (
        releases.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => router.push(`/release/${r.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open release ${r.title}`}
            style={{
              marginTop: 8,
              padding: 14,
              borderRadius: 12,
              backgroundColor: "#16161b",
              minHeight: 44,
            }}
          >
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "600" }}>{r.title}</Text>
            <Text style={{ color: "#7a7a85", marginTop: 4, textTransform: "capitalize" }}>{r.type}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
