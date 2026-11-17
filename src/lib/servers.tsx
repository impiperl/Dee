import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { MinLevel } from './types';

export interface Server {
  id: string;
  name: string; // name reported by Tweedle
  url: string; // public URL, e.g. https://example.com/tweedle
  token: string;
  minLevel: MinLevel;
}

interface ServersValue {
  loaded: boolean;
  servers: Server[];
  active: Server | null;
  setActive: (id: string) => void;
  /** Adds a server; one with the same URL is replaced (re-pairing). */
  add: (s: Omit<Server, 'id'>) => Server;
  update: (id: string, patch: Partial<Omit<Server, 'id'>>) => void;
  remove: (id: string) => void;
}

const ServersContext = createContext<ServersValue | null>(null);

// Tokens are secrets, so the whole list lives in the secure store.
const LIST_KEY = 'dee.servers';
const ACTIVE_KEY = 'dee.activeServer';

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function ServersProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [servers, setServers] = useState<Server[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Always the latest list, so callbacks stay stable; only set via persist and load.
  const serversRef = useRef<Server[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(LIST_KEY);
        if (raw) {
          serversRef.current = JSON.parse(raw);
          setServers(serversRef.current);
        }
        setActiveId(await AsyncStorage.getItem(ACTIVE_KEY));
      } catch {
        // start empty
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback((list: Server[]) => {
    serversRef.current = list;
    setServers(list);
    SecureStore.setItemAsync(LIST_KEY, JSON.stringify(list)).catch(() => {});
  }, []);

  const setActive = useCallback((id: string) => {
    setActiveId(id);
    AsyncStorage.setItem(ACTIVE_KEY, id).catch(() => {});
  }, []);

  const add = useCallback(
    (s: Omit<Server, 'id'>) => {
      const list = serversRef.current;
      const existing = list.find((x) => x.url === s.url);
      const server: Server = { ...s, id: existing?.id ?? newId() };
      persist(existing ? list.map((x) => (x.id === server.id ? server : x)) : [...list, server]);
      setActive(server.id);
      return server;
    },
    [persist, setActive],
  );

  const update = useCallback(
    (id: string, patch: Partial<Omit<Server, 'id'>>) => {
      persist(serversRef.current.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(serversRef.current.filter((x) => x.id !== id));
    },
    [persist],
  );

  const value = useMemo<ServersValue>(() => {
    const active = servers.find((s) => s.id === activeId) ?? servers[0] ?? null;
    return { loaded, servers, active, setActive, add, update, remove };
  }, [loaded, servers, activeId, setActive, add, update, remove]);

  return <ServersContext.Provider value={value}>{children}</ServersContext.Provider>;
}

export function useServers(): ServersValue {
  const v = useContext(ServersContext);
  if (!v) throw new Error('useServers outside ServersProvider');
  return v;
}
