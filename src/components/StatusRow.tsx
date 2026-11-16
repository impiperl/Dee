import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type { Level } from '@/lib/types';
import { LevelDot } from './LevelDot';

export function StatusRow({
  level,
  title,
  detail,
  right,
}: {
  level: Level | 'offline';
  title: string;
  detail?: string;
  right?: string;
}) {
  return (
    <View style={styles.row}>
      <LevelDot level={level} />
      <View style={styles.main}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {title}
        </Text>
        {detail ? (
          <Text variant="bodySmall" style={styles.detail} numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
      </View>
      {right ? (
        <Text variant="bodySmall" style={styles.detail}>
          {right}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  main: { flex: 1 },
  detail: { opacity: 0.7 },
});
