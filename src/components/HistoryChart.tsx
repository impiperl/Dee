import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';

import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { Server } from '@/lib/servers';
import type { HistoryRange, MetricPoint } from '@/lib/types';
import { Section } from './Section';

const RANGES: HistoryRange[] = ['1h', '6h', '24h', '7d'];
const Y_LABEL_WIDTH = 34;
const LABELS = 4;

export function HistoryChart({ server }: { server: Server }) {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const [range, setRange] = useState<HistoryRange>('1h');
  const [points, setPoints] = useState<MetricPoint[] | null>(null);
  const [width, setWidth] = useState(0);

  const load = useCallback(
    () =>
      api.history({ url: server.url, token: server.token }, range).then(
        (r) => setPoints(r.points ?? []),
        () => {}, // keep what we have; the status line already shows connection problems
      ),
    [server.url, server.token, range],
  );

  useEffect(() => {
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [load]);

  const cpuColor = theme.colors.primary;
  const memColor = theme.dark ? '#d9a6f0' : '#8a4fb0';
  const n = points?.length ?? 0;
  const plotWidth = Math.max(0, width - Y_LABEL_WIDTH - 16);
  const spacing = n > 1 ? plotWidth / (n - 1) : plotWidth;
  const labelEvery = Math.max(1, Math.floor(n / LABELS));
  const label = (p: MetricPoint, i: number) => {
    if (i % labelEvery !== 0) return undefined;
    const d = new Date(p.t);
    return range === '7d'
      ? d.toLocaleDateString(lang, { day: '2-digit', month: '2-digit' })
      : d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  };
  const labelStyle = { color: theme.colors.onSurfaceVariant, fontSize: 10, width: 44 };

  return (
    <Section title={t('history')}>
      <SegmentedButtons
        density="small"
        value={range}
        onValueChange={(v) => setRange(v as HistoryRange)}
        buttons={RANGES.map((r) => ({ value: r, label: r }))}
      />
      <View style={styles.legend}>
        <Legend color={cpuColor} text={t('cpu')} />
        <Legend color={memColor} text={t('ram')} />
      </View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.chart}>
        {points === null ? null : n < 2 ? (
          <Text variant="bodySmall" style={styles.dim}>
            {t('history_empty')}
          </Text>
        ) : width > 0 ? (
          <LineChart
            data={points.map((p, i) => ({ value: p.cpu, label: label(p, i), labelTextStyle: labelStyle }))}
            data2={points.map((p) => ({ value: p.mem }))}
            height={150}
            width={plotWidth}
            maxValue={100}
            noOfSections={4}
            spacing={spacing}
            initialSpacing={0}
            endSpacing={0}
            thickness={2}
            color1={cpuColor}
            color2={memColor}
            hideDataPoints
            disableScroll
            yAxisLabelWidth={Y_LABEL_WIDTH}
            yAxisLabelSuffix="%"
            yAxisTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
            yAxisColor="transparent"
            xAxisColor={theme.colors.outlineVariant}
            rulesColor={theme.colors.outlineVariant}
            rulesType="dashed"
          />
        ) : null}
      </View>
    </Section>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text variant="bodySmall">{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 3, borderRadius: 2 },
  chart: { minHeight: 40 },
  dim: { opacity: 0.7 },
});
