import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text } from 'react-native-paper';

import { LevelDot } from '@/components/LevelDot';
import { Section } from '@/components/Section';
import { api } from '@/lib/api';
import { useI18n, type LangSetting } from '@/lib/i18n';
import { useLive } from '@/lib/live';
import { usePush } from '@/lib/pushSync';
import { useServers, type Server } from '@/lib/servers';
import type { MinLevel } from '@/lib/types';

export default function Settings() {
  const { t, setting, setSetting } = useI18n();
  const { servers } = useServers();
  const push = usePush();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Section title={t('settings_servers')}>
        {servers.map((s) => (
          <ServerSettings key={s.id} server={s} />
        ))}
        <Button mode="contained-tonal" icon="qrcode-scan" onPress={() => router.push('/pair')}>
          {t('add_server')}
        </Button>
        <Button mode="text" icon="help-circle-outline" onPress={() => router.push('/help')}>
          {t('help_link')}
        </Button>
        {push.state === 'denied' ? <HelperText type="info">{t('push_denied')}</HelperText> : null}
        {push.state === 'unavailable' ? <HelperText type="info">{t('push_unavailable')}</HelperText> : null}
      </Section>

      <Section title={t('language')}>
        <SegmentedButtons
          density="small"
          value={setting}
          onValueChange={(v) => setSetting(v as LangSetting)}
          buttons={[
            { value: 'system', label: t('lang_system') },
            { value: 'de', label: 'Deutsch' },
            { value: 'en', label: 'English' },
          ]}
        />
      </Section>

      <Text variant="bodySmall" style={styles.version}>
        {t('version', { version: Constants.expoConfig?.version ?? '' })}
      </Text>
    </ScrollView>
  );
}

function ServerSettings({ server }: { server: Server }) {
  const { t } = useI18n();
  const { update, remove } = useServers();
  const { levels } = useLive();
  const [error, setError] = useState<string | null>(null);
  const ep = { url: server.url, token: server.token };

  const setMinLevel = async (minLevel: MinLevel) => {
    const before = server.minLevel;
    update(server.id, { minLevel });
    try {
      await api.updateDevice(ep, { minLevel });
      setError(null);
    } catch (e: any) {
      update(server.id, { minLevel: before });
      setError(t('saved_failed', { error: e.message }));
    }
  };

  const confirmRemove = () =>
    Alert.alert(t('remove_title', { name: server.name }), t('remove_text'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('remove'),
        style: 'destructive',
        onPress: () => {
          // Unpairing on the server is best effort; the server may be down.
          api.unpair(ep).catch(() => {});
          remove(server.id);
        },
      },
    ]);

  return (
    <View style={styles.server}>
      <View style={styles.serverHead}>
        <LevelDot level={levels[server.id] ?? 'ok'} />
        <View style={styles.flex}>
          <Text variant="titleSmall">{server.name}</Text>
          <Text variant="bodySmall" style={styles.dim}>
            {server.url}
          </Text>
        </View>
        <Button compact onPress={confirmRemove}>
          {t('remove')}
        </Button>
      </View>
      <Text variant="labelMedium" style={styles.dim}>
        {t('settings_push')}
      </Text>
      <SegmentedButtons
        density="small"
        value={server.minLevel}
        onValueChange={(v) => setMinLevel(v as MinLevel)}
        buttons={[
          { value: 'info', label: t('level_info') },
          { value: 'warn', label: t('level_warn') },
          { value: 'error', label: t('level_error') },
          { value: 'none', label: t('min_none') },
        ]}
      />
      {error ? <HelperText type="error">{error}</HelperText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  server: { gap: 8, paddingBottom: 8 },
  serverHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  dim: { opacity: 0.7 },
  version: { textAlign: 'center', marginTop: 24, opacity: 0.5 },
});
