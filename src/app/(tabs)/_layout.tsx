import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { useTheme } from 'react-native-paper';

import { useI18n } from '@/lib/i18n';
import { useLive } from '@/lib/live';
import { useServers } from '@/lib/servers';

export default function TabsLayout() {
  const { t } = useI18n();
  const theme = useTheme();
  const { unseen } = useLive();
  const { active } = useServers();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: { backgroundColor: theme.colors.surface },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_dashboard'),
          headerTitle: active?.name ?? 'Dee',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="server" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: t('tab_events'),
          headerTitle: active ? `${t('tab_events')} · ${active.name}` : t('tab_events'),
          tabBarBadge: unseen > 0 ? (unseen > 99 ? '99+' : unseen) : undefined,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bell-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tab_settings'),
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
