import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

import { useLive } from '@/lib/live';
import { useServers } from '@/lib/servers';
import { LevelDot } from './LevelDot';

/** One chip per server with its overall level; hidden with only one server. */
export function ServerChips() {
  const { servers, active, setActive } = useServers();
  const { levels } = useLive();
  if (servers.length < 2) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {servers.map((s) => (
        <Chip
          key={s.id}
          selected={s.id === active?.id}
          showSelectedCheck={false}
          onPress={() => setActive(s.id)}
          icon={() => <LevelDot level={levels[s.id] ?? 'ok'} />}>
          {s.name}
        </Chip>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 12, paddingTop: 12 },
});
