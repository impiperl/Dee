import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { ConnBanner } from '@/components/ConnBanner';
import { HistoryChart } from '@/components/HistoryChart';
import { Meter } from '@/components/Meter';
import { Section } from '@/components/Section';
import { ServerChips } from '@/components/ServerChips';
import { StatusRow } from '@/components/StatusRow';
import { Welcome } from '@/components/Welcome';
import { bytes, day, duration, pct, rate } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useLive } from '@/lib/live';
import { useServers } from '@/lib/servers';
import type { Level, Snapshot } from '@/lib/types';

export default function Dashboard() {
  const { loaded, active } = useServers();
  const { snapshot, refresh } = useLive();
  const [refreshing, setRefreshing] = useState(false);

  if (!loaded) return null;
  if (!active) return <Welcome />;

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ServerChips />
      <ConnBanner />
      {snapshot ? <SnapshotView snap={snapshot} /> : <ActivityIndicator style={styles.spinner} />}
      <HistoryChart key={active.id} server={active} />
    </ScrollView>
  );
}

function SnapshotView({ snap }: { snap: Snapshot }) {
  const { t, lang } = useI18n();
  const lv = (key: string): Level => snap.levels?.[key] ?? 'ok';
  const sys = snap.system;

  return (
    <>
      {sys ? (
        <>
          <Text variant="bodySmall" style={styles.meta}>
            {[sys.hostname, t('uptime', { value: duration(sys.uptime, lang) }), t('cores', { n: sys.cores })].join(
              ' · ',
            )}
          </Text>
          <View style={styles.grid}>
            <Meter label={t('cpu')} value={pct(sys.cpuPct)} fraction={sys.cpuPct / 100} level={lv('cpu')} />
            <Meter
              label={t('ram')}
              value={pct(sys.memPct)}
              fraction={sys.memPct / 100}
              detail={t('of', { used: bytes(sys.memUsed), total: bytes(sys.memTotal) })}
              level={lv('mem')}
            />
          </View>
          <View style={styles.grid}>
            <Meter
              label={t('load')}
              value={sys.load5.toFixed(2)}
              fraction={sys.load5 / Math.max(1, sys.cores) / 2}
              detail={`${sys.load1.toFixed(2)} · ${sys.load5.toFixed(2)} · ${sys.load15.toFixed(2)}`}
              level={lv('load')}
            />
            {sys.swapTotal > 0 ? (
              <Meter
                label={t('swap')}
                value={pct(sys.swapPct)}
                fraction={sys.swapPct / 100}
                detail={t('of', { used: bytes(sys.swapUsed), total: bytes(sys.swapTotal) })}
                level={lv('swap')}
              />
            ) : (
              <Meter label={t('network')} value={`↓ ${rate(sys.netRxRate)}`} fraction={0} detail={`↑ ${rate(sys.netTxRate)}`} level="ok" />
            )}
          </View>

          {sys.disks?.length ? (
            <Section title={t('disks')}>
              {sys.disks.map((d) => (
                <StatusRow
                  key={d.mount}
                  level={worse(lv('disk:' + d.mount), lv('inodes:' + d.mount))}
                  title={`${d.mount}  ${pct(d.usedPct)}`}
                  detail={`${t('of', { used: bytes(d.used), total: bytes(d.total) })} · ${t('inodes', { value: Math.round(d.inodesPct) })}`}
                />
              ))}
            </Section>
          ) : null}

          {sys.swapTotal > 0 ? (
            <Section title={t('network')}>
              <Text variant="bodyMedium">
                ↓ {rate(sys.netRxRate)}    ↑ {rate(sys.netTxRate)}
              </Text>
            </Section>
          ) : null}
        </>
      ) : null}

      {snap.endpoints?.length ? (
        <Section title={t('endpoints')}>
          {snap.endpoints.map((e) => (
            <StatusRow
              key={e.name}
              level={e.level}
              title={e.name}
              detail={e.error ?? (e.status ? `HTTP ${e.status}` : undefined)}
              right={e.error ? undefined : `${e.latencyMs} ms`}
            />
          ))}
        </Section>
      ) : null}

      {snap.processes?.length ? (
        <Section title={t('processes')}>
          {snap.processes.map((p) => (
            <StatusRow
              key={p.name}
              level={p.level}
              title={p.name}
              detail={p.count > 0 ? `${pct(p.cpuPct)} · ${bytes(p.rss)}` : undefined}
              right={`${p.count}/${p.minCount}`}
            />
          ))}
        </Section>
      ) : null}

      {snap.podmanError ? (
        <Section title={t('containers')}>
          <StatusRow level={lv('podman')} title="podman" detail={snap.podmanError} />
        </Section>
      ) : snap.containers?.length ? (
        <Section title={t('containers')}>
          {[...snap.containers]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <StatusRow key={c.name} level={c.level} title={c.name} detail={c.found ? c.status : t('not_found')} />
            ))}
        </Section>
      ) : null}

      {snap.certs?.length ? (
        <Section title={t('certs')}>
          {snap.certs.map((c) => {
            const parts: string[] = [];
            if (c.notAfter && !c.notAfter.startsWith('0001')) {
              parts.push(day(c.notAfter, lang));
              parts.push(c.daysLeft >= 0 ? t('days_left', { days: c.daysLeft }) : t('expired'));
            }
            if (c.error) parts.push(c.error);
            return <StatusRow key={c.name} level={c.level} title={c.name} detail={parts.join(' · ')} />;
          })}
        </Section>
      ) : null}
    </>
  );
}

const rank: Record<Level, number> = { ok: 0, info: 1, warn: 2, error: 3 };
function worse(a: Level, b: Level): Level {
  return rank[a] >= rank[b] ? a : b;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  spinner: { marginTop: 48 },
  meta: { marginHorizontal: 16, marginTop: 4, opacity: 0.7 },
  grid: { flexDirection: 'row', gap: 12, marginHorizontal: 12, marginTop: 12 },
});
