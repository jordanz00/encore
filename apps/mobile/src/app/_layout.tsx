import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout(): JSX.Element {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerTitle: "Encore" }}>
        <Stack.Screen name="index" options={{ title: "Discover" }} />
        <Stack.Screen name="search" options={{ title: "Search" }} />
        <Stack.Screen name="release/[id]" options={{ title: "Release" }} />
        <Stack.Screen name="artist/[slug]" options={{ title: "Artist" }} />
      </Stack>
    </>
  );
}
