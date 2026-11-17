import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { api, type ApiError } from './api';
import { useI18n } from './i18n';
import { getPushToken, setupChannels, type PushState } from './push';
import { useServers } from './servers';

interface PushValue {
  state: PushState | 'pending';
  token?: string;
}

const PushContext = createContext<PushValue>({ state: 'pending' });

const RETRY_MS = 30_000;

/**
 * Gets the push token, keeps every paired server informed about token and
 * language, and opens the events of the right server when a message is tapped.
 */
export function PushProvider({ children }: { children: React.ReactNode }) {
  const { t, lang } = useI18n();
  const { loaded, servers, setActive } = useServers();
  const [push, setPush] = useState<PushValue>({ state: 'pending' });
  const synced = useRef(new Map<string, string>()); // server id → "token|lang" last sent
  // Bumped to send again what failed: after a pause and when the app comes back.
  const [attempt, setAttempt] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Bumped to fetch the token again: it failed, it changed, or push may have been allowed meanwhile.
  const [tokenTry, setTokenTry] = useState(0);
  const tokenTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasToken = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setAttempt((n) => n + 1);
      if (!hasToken.current) setTokenTry((n) => n + 1);
    });
    const tokenSub = Notifications.addPushTokenListener(() => setTokenTry((n) => n + 1));
    return () => {
      sub.remove();
      tokenSub.remove();
      clearTimeout(retryTimer.current);
      clearTimeout(tokenTimer.current);
    };
  }, []);

  useEffect(() => {
    setupChannels(t).catch(() => {});
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    // Only the first fetch asks for permission; later ones just look.
    getPushToken(tokenTry === 0).then((r) => {
      if (cancelled) return;
      hasToken.current = !!r.token;
      setPush({ state: r.state, token: r.token });
      if (r.failed) {
        clearTimeout(tokenTimer.current);
        tokenTimer.current = setTimeout(() => setTokenTry((n) => n + 1), RETRY_MS);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tokenTry]);

  useEffect(() => {
    if (!loaded || push.state === 'pending') return;
    for (const s of servers) {
      const want = `${push.token ?? ''}|${lang}`;
      if (synced.current.get(s.id) === want) continue;
      synced.current.set(s.id, want);
      const patch: { lang: string; pushToken?: string } = { lang };
      if (push.token) patch.pushToken = push.token;
      api.updateDevice({ url: s.url, token: s.token }, patch).catch((e: ApiError) => {
        synced.current.delete(s.id);
        if (e.status === 401) return; // no longer paired; the app shows that elsewhere
        clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => setAttempt((n) => n + 1), RETRY_MS);
      });
    }
  }, [loaded, servers, push, lang, attempt]);

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
