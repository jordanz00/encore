import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

interface SearchArtistHit {
  id: string;
  name: string;
  slug: string;
}

interface SearchReleaseHit {
  id: string;
  title: string;
  type: string;
  primaryArtistName: string;
}

interface SearchTrackHit {
  id: string;
  title: string;
  releaseId: string;
  releaseTitle: string;
  durationMs: number;
}

interface SearchResponse {
  artists: SearchArtistHit[];
  releases: SearchReleaseHit[];
  tracks: SearchTrackHit[];
  source: string;
  error?: string;
}

export default function SearchScreen(): JSX.Element {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);

  async function runSearch(): Promise<void> {
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/search?q=${encodeURIComponent(query)}`);
      if (!r.ok) throw new Error("search_failed");
      const json = (await r.json()) as SearchResponse;
      if (json.error) setError("Search temporarily unavailable.");
      setResults(json);
    } catch {
      setError("Could not search. Check API connection.");
      setResults({ artists: [], releases: [], tracks: [], source: "postgres" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0b0b0e" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ color: "#fafafa", fontSize: 28, fontWeight: "700" }} accessibilityRole="header">
        Search
      </Text>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Artists, releases, tracks…"
        placeholderTextColor="#7a7a85"
        accessibilityLabel="Search query"
        style={{
          marginTop: 16,
          minHeight: 48,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#333",
          paddingHorizontal: 14,
          color: "#fafafa",
          fontSize: 16,
        }}
        onSubmitEditing={() => void runSearch()}
        returnKeyType="search"
      />
      <Pressable
        onPress={() => void runSearch()}
        disabled={loading || !q.trim()}
        accessibilityRole="button"
        accessibilityLabel="Run search"
        accessibilityState={{ disabled: loading || !q.trim() }}
        style={{
          marginTop: 12,
          minHeight: 48,
          borderRadius: 24,
          backgroundColor: loading ? "#555" : "#dc2626",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" accessibilityLabel="Searching" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Search</Text>
        )}
      </Pressable>

      {error && (
        <Text style={{ color: "#f87171", marginTop: 16, fontSize: 15 }} accessibilityRole="alert">
          {error}
        </Text>
      )}

      {results && (
        <View style={{ marginTop: 24, gap: 20 }}>
          <ResultBlock
            title="Artists"
            empty={results.artists.length === 0}
            items={results.artists.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => router.push(`/artist/${a.slug}`)}
                accessibilityRole="link"
                accessibilityLabel={`Artist ${a.name}`}
                style={{ paddingVertical: 10, minHeight: 44 }}
              >
                <Text style={{ color: "#fafafa", fontSize: 16 }}>{a.name}</Text>
                <Text style={{ color: "#7a7a85", fontSize: 13 }}>@{a.slug}</Text>
              </Pressable>
            ))}
          />
          <ResultBlock
            title="Releases"
            empty={results.releases.length === 0}
            items={results.releases.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => router.push(`/release/${r.id}`)}
                accessibilityRole="link"
                accessibilityLabel={`Release ${r.title}`}
                style={{ paddingVertical: 10, minHeight: 44 }}
              >
                <Text style={{ color: "#fafafa", fontSize: 16 }}>{r.title}</Text>
                <Text style={{ color: "#7a7a85", fontSize: 13 }}>
                  {r.type} · {r.primaryArtistName}
                </Text>
              </Pressable>
            ))}
          />
          <ResultBlock
            title="Tracks"
            empty={results.tracks.length === 0}
            items={results.tracks.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/release/${t.releaseId}`)}
                accessibilityRole="link"
                accessibilityLabel={`Track ${t.title} on ${t.releaseTitle}`}
                style={{ paddingVertical: 10, minHeight: 44 }}
              >
                <Text style={{ color: "#fafafa", fontSize: 16 }}>{t.title}</Text>
                <Text style={{ color: "#7a7a85", fontSize: 13 }}>{t.releaseTitle}</Text>
              </Pressable>
            ))}
          />
        </View>
      )}
    </ScrollView>
  );
}

function ResultBlock({
  title,
  empty,
  items,
}: {
  title: string;
  empty: boolean;
  items: React.ReactNode[];
}): JSX.Element {
  return (
    <View>
      <Text style={{ color: "#fafafa", fontSize: 18, fontWeight: "600" }} accessibilityRole="header">
        {title}
      </Text>
      {empty ? (
        <Text style={{ color: "#7a7a85", marginTop: 8 }}>No matches.</Text>
      ) : (
        <View style={{ marginTop: 4 }}>{items}</View>
      )}
    </View>
  );
}
