import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { I18nProvider, useI18n } from '@/lib/i18n';
import { LiveProvider } from '@/lib/live';
import { PushProvider } from '@/lib/pushSync';
import { ServersProvider } from '@/lib/servers';
import { darkTheme, lightTheme } from '@/lib/theme';

function Screens() {
  const { t } = useI18n();
  const theme = useColorScheme() === 'dark' ? darkTheme : lightTheme;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pair" options={{ title: t('pair_title'), presentation: 'modal' }} />
      <Stack.Screen name="help" options={{ title: t('help_title') }} />
    </Stack>
  );
}

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <PaperProvider theme={dark ? darkTheme : lightTheme}>
        <I18nProvider>
          <ServersProvider>
            <LiveProvider>
              <PushProvider>
                <StatusBar style={dark ? 'light' : 'dark'} />
                <Screens />
              </PushProvider>
            </LiveProvider>
          </ServersProvider>
        </I18nProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
