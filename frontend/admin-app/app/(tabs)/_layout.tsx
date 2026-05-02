import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { admin } = useAdminAuth();

  // Only show tabs for authorized roles
  const canManageEvents = admin?.role === 'admin' || admin?.role === 'event_creator';
  const canScanGate = admin?.role === 'admin' || admin?.role === 'gate_operator';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
      }}>
      {canManageEvents && (
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
            headerTitle: 'Event Management',
          }}
        />
      )}
      {canScanGate && (
        <Tabs.Screen
          name="gate"
          options={{
            title: 'Gate',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="qrcode" color={color} />,
            headerTitle: 'Gate Scanner',
          }}
        />
      )}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}
