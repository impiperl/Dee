import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const de = {
  tab_dashboard: 'Übersicht',
  tab_events: 'Meldungen',
  tab_settings: 'Einstellungen',

  level_ok: 'OK',
  level_info: 'Info',
  level_warn: 'Warnung',
  level_error: 'Fehler',

  welcome_title: 'Noch kein Server',
  welcome_text: 'Auf dem Server „sudo tweedle pair“ ausführen und den QR-Code scannen.',
  add_server: 'Server hinzufügen',
  help_title: 'Zum Server',
  help_link: 'Wie komme ich zum Server?',

  pair_title: 'Server koppeln',
  pair_scan: 'QR-Code',
  pair_manual: 'Code eingeben',
  pair_url: 'Adresse',
  pair_code: 'Code',
  pair_submit: 'Koppeln',
  pair_busy: 'Wird gekoppelt …',
  pair_camera_needed: 'Zum Scannen braucht Dee die Kamera.',
  pair_camera_allow: 'Kamera erlauben',
  pair_not_tweedle: 'Das ist kein Tweedle-Code.',
  pair_code_invalid: 'Code ungültig oder abgelaufen. Mit „tweedle pair“ einen neuen erzeugen.',
  pair_failed: 'Koppeln fehlgeschlagen: {error}',
  pair_hint: 'Der Code gilt 10 Minuten und nur einmal.',

  conn_live: 'Live',
  conn_connecting: 'Verbinde …',
  conn_offline: 'Nicht erreichbar',
  conn_unauthorized: 'Dieses Gerät ist auf dem Server nicht mehr gekoppelt.',
  pair_again: 'Neu koppeln',
  retry: 'Erneut versuchen',
  updated: 'Stand {time}',
  uptime: 'läuft seit {value}',
  cores: '{n} Kerne',

  cpu: 'CPU',
  ram: 'RAM',
  swap: 'Swap',
  load: 'Load',
  disks: 'Platten',
  network: 'Netzwerk',
  history: 'Verlauf',
  history_empty: 'Noch keine Werte.',
  processes: 'Prozesse',
  containers: 'Container',
  certs: 'Zertifikate',
  endpoints: 'Erreichbarkeit',
  inodes: 'Inodes {value} %',
  days_left: 'noch {days} Tage',
  expired: 'abgelaufen',
  not_found: 'nicht gefunden',
  of: '{used} von {total}',

  events_empty: 'Keine Meldungen.',
  filter_all: 'Alle',
  filter_warn: 'Ab Warnung',
  filter_error: 'Fehler',
  new: 'neu',
  load_failed: 'Laden fehlgeschlagen: {error}',

  settings_servers: 'Server',
  settings_push: 'Push-Nachrichten ab',
  min_none: 'Keine',
  push_denied: 'Push ist für Dee ausgeschaltet. In den Systemeinstellungen erlauben.',
  push_unavailable: 'Push geht nur auf einem echten Gerät mit einem Build von Dee.',
  remove: 'Entfernen',
  remove_title: '{name} entfernen?',
  remove_text: 'Dee wird auch auf dem Server abgemeldet.',
  cancel: 'Abbrechen',
  language: 'Sprache',
  lang_system: 'System',
  saved_failed: 'Speichern fehlgeschlagen: {error}',
  version: 'Dee {version}',
  privacy: 'Datenschutz',
};

type Key = keyof typeof de;

const en: Record<Key, string> = {
  tab_dashboard: 'Overview',
  tab_events: 'Events',
  tab_settings: 'Settings',

  level_ok: 'OK',
  level_info: 'Info',
  level_warn: 'Warning',
  level_error: 'Error',

  welcome_title: 'No server yet',
  welcome_text: 'Run “sudo tweedle pair” on the server and scan the QR code.',
  add_server: 'Add server',
  help_title: 'Reaching a server',
  help_link: 'How do I reach a server?',

  pair_title: 'Pair server',
  pair_scan: 'QR code',
  pair_manual: 'Enter code',
  pair_url: 'Address',
  pair_code: 'Code',
  pair_submit: 'Pair',
  pair_busy: 'Pairing …',
  pair_camera_needed: 'Dee needs the camera to scan.',
  pair_camera_allow: 'Allow camera',
  pair_not_tweedle: 'This is not a Tweedle code.',
  pair_code_invalid: 'Code invalid or expired. Create a new one with “tweedle pair”.',
  pair_failed: 'Pairing failed: {error}',
  pair_hint: 'The code is valid for 10 minutes and only once.',

  conn_live: 'Live',
  conn_connecting: 'Connecting …',
  conn_offline: 'Unreachable',
  conn_unauthorized: 'This device is no longer paired with the server.',
  pair_again: 'Pair again',
  retry: 'Retry',
  updated: 'As of {time}',
  uptime: 'up {value}',
  cores: '{n} cores',

  cpu: 'CPU',
  ram: 'RAM',
  swap: 'Swap',
  load: 'Load',
  disks: 'Disks',
  network: 'Network',
  history: 'History',
  history_empty: 'No values yet.',
  processes: 'Processes',
  containers: 'Containers',
  certs: 'Certificates',
  endpoints: 'Reachability',
  inodes: 'Inodes {value} %',
  days_left: '{days} days left',
  expired: 'expired',
  not_found: 'not found',
  of: '{used} of {total}',

  events_empty: 'No events.',
  filter_all: 'All',
  filter_warn: 'Warning +',
  filter_error: 'Error',
  new: 'new',
  load_failed: 'Loading failed: {error}',

  settings_servers: 'Servers',
  settings_push: 'Push notifications from',
  min_none: 'None',
  push_denied: 'Push is switched off for Dee. Allow it in the system settings.',
  push_unavailable: 'Push only works on a real device with a build of Dee.',
  remove: 'Remove',
  remove_title: 'Remove {name}?',
  remove_text: 'Dee is also unpaired on the server.',
  cancel: 'Cancel',
  language: 'Language',
  lang_system: 'System',
  saved_failed: 'Saving failed: {error}',
  version: 'Dee {version}',
  privacy: 'Privacy policy',
};

export const dictionaries = { de, en };
export type Lang = keyof typeof dictionaries;
export type LangSetting = Lang | 'system';
export type TFunc = (key: Key, params?: Record<string, string | number>) => string;

export function systemLang(): Lang {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return code === 'de' ? 'de' : 'en';
}

export function translate(lang: Lang, key: Key, params?: Record<string, string | number>): string {
  let s = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

interface I18nValue {
  lang: Lang;
  setting: LangSetting;
  setSetting: (s: LangSetting) => void;
  t: TFunc;
}

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = 'dee.lang';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [setting, setSettingState] = useState<LangSetting>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'de' || v === 'en' || v === 'system') setSettingState(v);
      })
      .catch(() => {});
  }, []);

  const setSetting = useCallback((s: LangSetting) => {
    setSettingState(s);
    AsyncStorage.setItem(STORAGE_KEY, s).catch(() => {});
  }, []);

  const value = useMemo<I18nValue>(() => {
    const lang = setting === 'system' ? systemLang() : setting;
    return { lang, setting, setSetting, t: (key, params) => translate(lang, key, params) };
  }, [setting, setSetting]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const v = useContext(I18nContext);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}
