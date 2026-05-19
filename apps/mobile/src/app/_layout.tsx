import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout(): JSX.Element {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerTitle: "Encore" }}>
        <Stack.Screen name="index" options={{ title: "Discover" }} />
      </Stack>
    </>
  );
}
