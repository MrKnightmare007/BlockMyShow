import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AdminAuthProvider } from '@/context/AdminAuthContext';

export default function RootLayout() {
  return (
    <AdminAuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" backgroundColor="#0a0a0a" />
    </AdminAuthProvider>
  );
}
