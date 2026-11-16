import { StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text, useTheme } from 'react-native-paper';

import { levelColor } from '@/lib/theme';
import type { Level } from '@/lib/types';

/** A tile with a big value and a bar; the bar takes the color of the level. */
export function Meter({
  label,
  value,
  fraction,
  detail,
  level,
}: {
  label: string;
  value: string;
  fraction: number;
  detail?: string;
  level: Level;
}) {
  const theme = useTheme();
  const color = level === 'ok' ? theme.colors.primary : levelColor(level, theme.dark);
  return (
    <Card mode="contained" style={styles.card}>
      <View style={styles.inner}>
        <Text variant="labelMedium" style={styles.dim}>
          {label}
        </Text>
        <Text variant="headlineSmall" style={level !== 'ok' ? { color } : undefined}>
          {value}
        </Text>
        <ProgressBar progress={Math.max(0, Math.min(1, fraction))} color={color} style={styles.bar} />
        {detail ? (
          <Text variant="bodySmall" style={styles.dim} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  inner: { padding: 12, gap: 4 },
  bar: { height: 6, borderRadius: 3, marginTop: 4 },
  dim: { opacity: 0.7 },
});
