import { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Encore, type ApiRelease } from "@encore/sdk";

const sdk = new Encore({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001",
});

export default function DiscoverScreen(): JSX.Element {
  const [releases, setReleases] = useState<ApiRelease[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const r = await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001"}/recommendations/discover`);
      const json = (await r.json()) as { releases: ApiRelease[] };
      setReleases(json.releases ?? []);
    } catch {
      setReleases([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <ScrollView
      style={{ backgroundColor: "#0b0b0e" }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#fafafa" />}
    >
      <Text style={{ color: "#fafafa", fontSize: 28, fontWeight: "700" }}>
        Discover
      </Text>
      <Text style={{ color: "#7a7a85" }}>
        Chronological + editorial. No payola.
      </Text>
      <Pressable
        onPress={() => router.push("/search")}
        accessibilityRole="button"
        accessibilityLabel="Open search"
        style={{
          alignSelf: "flex-start",
          minHeight: 44,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#444",
        }}
      >
        <Text style={{ color: "#fafafa", fontWeight: "600" }}>Search</Text>
      </Pressable>
      {releases.length === 0 ? (
        <View style={{ padding: 24, borderRadius: 12, borderWidth: 1, borderColor: "#222" }}>
          <Text style={{ color: "#7a7a85" }}>
            No releases yet. Make sure the API is reachable at{" "}
            {process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001"}.
          </Text>
        </View>
      ) : (
        releases.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => router.push(`/release/${r.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open release ${r.title}`}
            style={{ padding: 16, borderRadius: 12, backgroundColor: "#16161b", minHeight: 44 }}
          >
            <Text style={{ color: "#fafafa", fontSize: 16, fontWeight: "600" }}>
              {r.title}
            </Text>
            <Text style={{ color: "#7a7a85", marginTop: 4 }}>{r.type}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
