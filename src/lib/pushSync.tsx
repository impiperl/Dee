import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { api } from './api';
import { useI18n } from './i18n';
import { getPushToken, setupChannels, type PushState } from './push';
import { useServers } from './servers';

interface PushValue {
  state: PushState | 'pending';
  token?: string;
}

const PushContext = createContext<PushValue>({ state: 'pending' });

/**
 * Gets the push token, keeps every paired server informed about token and
 * language, and opens the events of the right server when a message is tapped.
 */
export function PushProvider({ children }: { children: React.ReactNode }) {
  const { t, lang } = useI18n();
  const { loaded, servers, setActive } = useServers();
  const [push, setPush] = useState<PushValue>({ state: 'pending' });
  const synced = useRef(new Map<string, string>()); // server id → "token|lang" last sent

  useEffect(() => {
    setupChannels(t).catch(() => {});
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getPushToken().then((r) => {
        if (!cancelled) setPush(r);
      });
    load();
    const sub = Notifications.addPushTokenListener(() => load());
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!loaded || push.state === 'pending') return;
    for (const s of servers) {
      const want = `${push.token ?? ''}|${lang}`;
      if (synced.current.get(s.id) === want) continue;
      synced.current.set(s.id, want);
      const patch: { lang: string; pushToken?: string } = { lang };
      if (push.token) patch.pushToken = push.token;
      api.updateDevice({ url: s.url, token: s.token }, patch).catch(() => synced.current.delete(s.id));
    }
  }, [loaded, servers, push, lang]);

  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!loaded || !response) return;
    const id = response.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const url = response.notification.request.content.data?.url;
    const server = servers.find((s) => s.url === url);
    if (server) setActive(server.id);
    router.navigate('/events');
  }, [loaded, response, servers, setActive]);

  return <PushContext.Provider value={push}>{children}</PushContext.Provider>;
}

export function usePush(): PushValue {
  return useContext(PushContext);
}
