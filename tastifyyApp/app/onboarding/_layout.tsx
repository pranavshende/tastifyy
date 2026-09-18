import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="customer" />
      <Stack.Screen name="restaurant" />
      <Stack.Screen name="delivery" />
      <Stack.Screen name="status" />
    </Stack>
  );
}
