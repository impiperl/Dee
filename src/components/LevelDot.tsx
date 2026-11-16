import { View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { levelColor } from '@/lib/theme';
import type { Level } from '@/lib/types';

export function LevelDot({ level, size = 10 }: { level: Level | 'offline'; size?: number }) {
  const { dark } = useTheme();
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: levelColor(level, dark) }}
      accessibilityLabel={level}
    />
  );
}
