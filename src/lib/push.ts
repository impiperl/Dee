import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { TFunc } from './i18n';

export type PushState = 'ok' | 'denied' | 'unavailable';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Tweedle sends to the channels info, warn and error. */
export async function setupChannels(t: TFunc): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('error', {
    name: t('level_error'),
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 400, 200, 400],
  });
  await Notifications.setNotificationChannelAsync('warn', {
    name: t('level_warn'),
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync('info', {
    name: t('level_info'),
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
  });
}

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Asks for permission (once) and returns the Expo push token. */
export async function getPushToken(): Promise<{ state: PushState; token?: string }> {
  if (!Device.isDevice || !projectId()) return { state: 'unavailable' };
  let perm = await Notifications.getPermissionsAsync();
  if (perm.status !== 'granted' && perm.canAskAgain) {
    perm = await Notifications.requestPermissionsAsync();
  }
  if (perm.status !== 'granted') return { state: 'denied' };
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
    return { state: 'ok', token: data };
  } catch {
    return { state: 'unavailable' };
  }
}
