import type { Lang } from './i18n';

export function bytes(b: number): string {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let i = 0;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  return `${i === 0 ? b : b.toFixed(1)} ${units[i]}`;
}

export function rate(bps: number): string {
  return `${bytes(bps)}/s`;
}

export function pct(v: number): string {
  return `${Math.round(v)} %`;
}

export function duration(seconds: number, lang: Lang): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return lang === 'de' ? `${d} T ${h} Std` : `${d}d ${h}h`;
  if (h > 0) return lang === 'de' ? `${h} Std ${m} Min` : `${h}h ${m}m`;
  return lang === 'de' ? `${m} Min` : `${m}m`;
}

export function time(d: Date | string, lang: Lang): string {
  return new Date(d).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
}

export function dateTime(d: Date | string, lang: Lang): string {
  const date = new Date(d);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  if (sameDay) return time(date, lang);
  return date.toLocaleString(lang, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function day(d: Date | string, lang: Lang): string {
  return new Date(d).toLocaleDateString(lang, { day: '2-digit', month: '2-digit', year: 'numeric' });
}
