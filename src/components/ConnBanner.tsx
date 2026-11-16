import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { useI18n } from '@/lib/i18n';
import { useLive } from '@/lib/live';
import { time } from '@/lib/format';
import { LevelDot } from './LevelDot';

/** Connection line under the server chips; with actions when something is wrong. */
export function ConnBanner() {
  const { t, lang } = useI18n();
  const { conn, error, updatedAt, refresh } = useLive();

  if (conn === 'unauthorized') {
    return (
      <View style={styles.box}>
        <Text variant="bodyMedium">{t('conn_unauthorized')}</Text>
        <Button mode="contained-tonal" onPress={() => router.push('/pair')}>
          {t('pair_again')}
        </Button>
      </View>
    );
  }
  if (conn === 'offline') {
    return (
      <View style={styles.box}>
        <View style={styles.line}>
          <LevelDot level="offline" />
          <Text variant="bodyMedium">
            {t('conn_offline')}
            {error ? ` (${error})` : ''}
          </Text>
        </View>
        {updatedAt ? (
          <Text variant="bodySmall" style={styles.dim}>
            {t('updated', { time: time(updatedAt, lang) })}
          </Text>
        ) : null}
        <Button mode="contained-tonal" onPress={refresh}>
          {t('retry')}
        </Button>
      </View>
    );
  }
  const text =
    conn === 'live'
      ? t('conn_live')
      : conn === 'connecting'
        ? t('conn_connecting')
        : updatedAt
          ? t('updated', { time: time(updatedAt, lang) })
          : t('conn_connecting');
  return (
    <View style={[styles.line, styles.slim]}>
      <LevelDot level={conn === 'live' ? 'ok' : 'offline'} size={8} />
      <Text variant="bodySmall" style={styles.dim}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginHorizontal: 12, marginTop: 12, gap: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slim: { marginHorizontal: 16, marginTop: 10 },
  dim: { opacity: 0.7 },
});
