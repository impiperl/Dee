import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

import type { Level } from './types';

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: '#2f6f8f', secondaryContainer: '#d3e6ef' },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: { ...MD3DarkTheme.colors, primary: '#8cc6e0', secondaryContainer: '#29495a' },
};

const levelLight: Record<Level | 'offline', string> = {
  ok: '#2e8b57',
  info: '#3b78c4',
  warn: '#c98a00',
  error: '#cc3b3b',
  offline: '#8a8f98',
};

const levelDark: Record<Level | 'offline', string> = {
  ok: '#5cc98b',
  info: '#79aef0',
  warn: '#f0b93a',
  error: '#f07070',
  offline: '#9aa0a8',
};

export function levelColor(level: Level | 'offline', dark: boolean): string {
  return (dark ? levelDark : levelLight)[level];
}
