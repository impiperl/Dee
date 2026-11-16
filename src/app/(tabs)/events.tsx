import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, SegmentedButtons, Text, useTheme } from 'react-native-paper';

import { ServerChips } from '@/components/ServerChips';
import { Welcome } from '@/components/Welcome';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { useLive } from '@/lib/live';
import { useServers, type Server } from '@/lib/servers';
import { levelColor } from '@/lib/theme';
import type { Level, TweedleEvent } from '@/lib/types';

type Filter = 'all' | 'warn' | 'error';
const PAGE = 50;
const rank: Record<Level, number> = { ok: 0, info: 1, warn: 2, error: 3 };

function passes(e: TweedleEvent, f: Filter) {
  return f === 'all' || rank[e.level] >= rank[f];
}

export default function Events() {
  const { t } = useI18n();
  const { active } = useServers();
  const [filter, setFilter] = useState<Filter>('all');

  if (!active) return <Welcome />;

  return (
    <View style={styles.flex}>
      <ServerChips />
      <SegmentedButtons
        style={styles.filter}
        density="small"
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        buttons={[
          { value: 'all', label: t('filter_all') },
          { value: 'warn', label: t('filter_warn') },
          { value: 'error', label: t('filter_error') },
        ]}
      />
      {/* A new key per server and filter starts the list from scratch. */}
      <EventList key={`${active.id}|${active.token}|${filter}`} server={active} filter={filter} />
    </View>
  );
}

function EventList({ server, filter }: { server: Server; filter: Filter }) {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const { onEvent, setUnseen } = useLive();
  const [events, setEvents] = useState<TweedleEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [end, setEnd] = useState(false);
  const loadingMore = useRef(false);
  const ep = useMemo(() => ({ url: server.url, token: server.token }), [server.url, server.token]);

  const load = useCallback(
    () =>
      api.events(ep, { limit: PAGE, minLevel: filter }).then(
        (r) => {
          setEvents(r.events);
          setEnd(r.events.length < PAGE);
          setUnseen(r.unseen);
          setError(null);
        },
        (e) => setError(e.message),
      ),
    [ep, filter, setUnseen],
  );

  useEffect(() => {
    load();
  }, [load]);

  // New events arrive over the live connection.
  useEffect(
    () =>
      onEvent((e) => {
        if (!passes(e, filter)) return;
        setEvents((list) => (list && !list.some((x) => x.id === e.id) ? [e, ...list] : list));
      }),
    [onEvent, filter],
  );

  // Whatever was shown while the screen is open counts as seen.
  const markSeen = useCallback(async () => {
    const newest = events?.[0];
    if (!newest || !events.some((e) => !e.seen)) return;
    try {
      const r = await api.seen(ep, newest.id);
      setUnseen(r.unseen);
    } catch {
      // try again next time
    }
  }, [events, ep, setUnseen]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(markSeen, 1500);
      return () => {
        clearTimeout(timer);
        // Remove the "new" marks only after leaving, so they stay visible while reading.
        setEvents((list) => list?.map((e) => (e.seen ? e : { ...e, seen: true })) ?? null);
      };
    }, [markSeen]),
  );

  const loadMore = async () => {
    if (!events?.length || end || loadingMore.current) return;
    loadingMore.current = true;
    try {
      const r = await api.events(ep, { before: events[events.length - 1].id, limit: PAGE, minLevel: filter });
      setEvents((list) => [...(list ?? []), ...r.events.filter((e) => !list?.some((x) => x.id === e.id))]);
      setEnd(r.events.length < PAGE);
    } catch {
      // leave it; scrolling again retries
    } finally {
      loadingMore.current = false;
    }
  };

  return error && !events ? (
        <Text style={styles.empty}>{t('load_failed', { error })}</Text>
      ) : events === null ? (
        <ActivityIndicator style={styles.empty} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => String(e.id)}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
          ListEmptyComponent={<Text style={styles.empty}>{t('events_empty')}</Text>}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const color = levelColor(item.level, theme.dark);
            return (
              <View style={[styles.item, { borderLeftColor: color, backgroundColor: theme.colors.surfaceVariant }]}>
                <View style={styles.itemHead}>
                  <Text variant="labelSmall" style={{ color }}>
                    {t(`level_${item.level}` as const).toUpperCase()}
                  </Text>
                  <Text variant="labelSmall" style={styles.dim}>
                    {!item.seen ? `${t('new')} · ` : ''}
                    {dateTime(item.time, lang)}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={!item.seen ? styles.unseen : undefined}>
                  {item.message}
                </Text>
              </View>
            );
          }}
        />
      );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filter: { marginHorizontal: 12, marginTop: 12 },
  list: { padding: 12, gap: 8 },
  empty: { textAlign: 'center', marginTop: 48, opacity: 0.7 },
  item: { borderLeftWidth: 4, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between' },
  dim: { opacity: 0.7 },
  unseen: { fontWeight: '600' },
});
