import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { api, ApiError, liveUrl } from './api';
import { useServers } from './servers';
import { snapshotLevel, type Level, type Snapshot, type TweedleEvent } from './types';

/**
 * live: WebSocket open, updates every tick.
 * polling: the server answers, but the WebSocket does not (status is reloaded on every retry).
 */
export type Conn = 'connecting' | 'live' | 'polling' | 'offline' | 'unauthorized';

type EventListener = (e: TweedleEvent) => void;

interface LiveValue {
  snapshot: Snapshot | null;
  unseen: number;
  setUnseen: (n: number) => void;
  conn: Conn;
  error: string | null;
  updatedAt: Date | null;
  refresh: () => Promise<void>;
  onEvent: (l: EventListener) => () => void;
  /** Worst reported level per server id; 'offline' if it does not answer. */
  levels: Record<string, Level | 'offline'>;
}

const LiveContext = createContext<LiveValue | null>(null);

const MAX_RETRY_MS = 30_000;
const OTHERS_EVERY_MS = 60_000;

interface LiveState {
  id?: string;
  snapshot: Snapshot | null;
  unseen: number;
  conn: Conn;
  error: string | null;
  updatedAt: Date | null;
}

const initial: LiveState = { snapshot: null, unseen: 0, conn: 'connecting', error: null, updatedAt: null };

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const { active, servers } = useServers();
  // State belongs to one server; after switching it starts fresh (see `cur`).
  const [st, setSt] = useState<LiveState>(initial);
  const [others, setOthers] = useState<Record<string, Level | 'offline'>>({});
  const listeners = useRef(new Set<EventListener>());
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const id = active?.id;
  const url = active?.url;
  const token = active?.token;
  const cur: LiveState = st.id === id ? st : { ...initial, id };

  const updateFor = useCallback((sid: string | undefined, fn: (s: LiveState) => Partial<LiveState>) => {
    setSt((s) => {
      const base = s.id === sid ? s : { ...initial, id: sid };
      return { ...base, ...fn(base) };
    });
  }, []);

  useEffect(() => {
    if (!url || !token) return;
    const set = (fn: (s: LiveState) => Partial<LiveState>) => updateFor(id, fn);

    const ep = { url, token };
    let ws: WebSocket | null = null;
    let stopped = false;
    let unauthorized = false;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const loadStatus = async (): Promise<boolean> => {
      try {
        const r = await api.status(ep);
        if (stopped) return false;
        const open = ws?.readyState === WebSocket.OPEN;
        set(() => ({
          snapshot: r.status,
          unseen: r.unseen,
          updatedAt: new Date(),
          error: null,
          ...(open ? {} : { conn: 'polling' as Conn }),
        }));
        return true;
      } catch (e) {
        if (stopped) return false;
        const err = e as ApiError;
        if (err.status === 401) {
          unauthorized = true;
          set(() => ({ conn: 'unauthorized' }));
        } else {
          set(() => ({ conn: 'offline', error: err.message }));
        }
        return false;
      }
    };

    const schedule = () => {
      if (stopped || unauthorized) return;
      clearTimeout(timer);
      const delay = Math.min(MAX_RETRY_MS, 2000 * 2 ** retry);
      retry++;
      timer = setTimeout(start, delay);
    };

    const connect = () => {
      if (stopped || unauthorized || ws) return;
      // React Native's WebSocket accepts headers as a third argument.
      const WS = WebSocket as unknown as new (
        url: string,
        protocols: string[] | undefined,
        options: { headers: Record<string, string> },
      ) => WebSocket;
      const sock = new WS(liveUrl(url), undefined, { headers: { Authorization: `Bearer ${token}` } });
      ws = sock;
      sock.onopen = () => {
        retry = 0;
        set(() => ({ conn: 'live' }));
      };
      sock.onmessage = (m) => {
        let msg: any;
        try {
          msg = JSON.parse(String(m.data));
        } catch {
          return;
        }
        if (msg.type === 'status') {
          set(() => ({ snapshot: msg.status, updatedAt: new Date() }));
        } else if (msg.type === 'event' && msg.event) {
          const ev = msg.event as TweedleEvent;
          if (ev.level === 'warn' || ev.level === 'error') set((s) => ({ unseen: s.unseen + 1 }));
          listeners.current.forEach((l) => l(ev));
        }
      };
      sock.onclose = () => {
        if (ws === sock) ws = null;
        if (stopped) return;
        set((s) => (s.conn === 'live' ? { conn: 'polling' } : {}));
        schedule();
      };
      sock.onerror = () => {};
    };

    const start = async () => {
      if (stopped || AppState.currentState !== 'active') return;
      const ok = await loadStatus();
      if (ok) connect();
      else schedule();
    };

    refreshRef.current = async () => {
      retry = 0;
      unauthorized = false;
      if (await loadStatus()) connect();
    };

    start();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        retry = 0;
        start();
      } else {
        clearTimeout(timer);
        ws?.close();
        ws = null;
      }
    });

    return () => {
      stopped = true;
      clearTimeout(timer);
      sub.remove();
      ws?.close();
    };
  }, [id, url, token, updateFor]);

  // The other servers are only asked for their overall level now and then.
  useEffect(() => {
    const rest = servers.filter((s) => s.id !== id);
    if (rest.length === 0) return;
    let stopped = false;
    const poll = async () => {
      if (AppState.currentState !== 'active') return;
      const results = await Promise.all(
        rest.map(async (s) => {
          try {
            const r = await api.status({ url: s.url, token: s.token });
            return [s.id, snapshotLevel(r.status)] as const;
          } catch {
            return [s.id, 'offline'] as const;
          }
        }),
      );
      if (!stopped) setOthers(Object.fromEntries(results));
    };
    poll();
    const t = setInterval(poll, OTHERS_EVERY_MS);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [servers, id]);

  const onEvent = useCallback((l: EventListener) => {
    listeners.current.add(l);
    return () => {
      listeners.current.delete(l);
    };
  }, []);

  const refresh = useCallback(() => refreshRef.current(), []);

  const setUnseen = useCallback((n: number) => updateFor(id, () => ({ unseen: n })), [updateFor, id]);

  const { snapshot, unseen, conn, error, updatedAt } = cur;
  const value = useMemo<LiveValue>(() => {
    const levels = { ...others };
    if (id) levels[id] = conn === 'offline' || conn === 'unauthorized' ? 'offline' : snapshotLevel(snapshot);
    return { snapshot, unseen, setUnseen, conn, error, updatedAt, refresh, onEvent, levels };
  }, [snapshot, unseen, setUnseen, conn, error, updatedAt, refresh, onEvent, others, id]);

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveValue {
  const v = useContext(LiveContext);
  if (!v) throw new Error('useLive outside LiveProvider');
  return v;
}
