import type {
  Device,
  HistoryRange,
  MetricPoint,
  MinLevel,
  StatusResponse,
  TweedleEvent,
} from './types';

export interface Endpoint {
  url: string; // e.g. https://gaistnet.com/mon (no trailing slash)
  token?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const TIMEOUT_MS = 10_000;

export function normalizeUrl(url: string): string {
  let u = url.trim().replace(/\/+$/, '');
  if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

async function request<T>(ep: Endpoint, path: string, init: RequestInit = {}): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body) headers['Content-Type'] = 'application/json';
  if (ep.token) headers.Authorization = `Bearer ${ep.token}`;
  try {
    const res = await fetch(ep.url + path, { ...init, headers, signal: ctrl.signal });
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      // not JSON (e.g. an nginx error page)
    }
    if (!res.ok) throw new ApiError(res.status, body?.error ?? `HTTP ${res.status}`);
    if (body === null) throw new ApiError(res.status, 'invalid response');
    return body as T;
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    if (e?.name === 'AbortError') throw new ApiError(0, 'timeout');
    throw new ApiError(0, e?.message ?? String(e));
  } finally {
    clearTimeout(timer);
  }
}

export interface PairResponse {
  token: string;
  deviceId: number;
  name: string;
}

export const api = {
  pair: (url: string, body: { code: string; name: string; lang: string; pushToken?: string }) =>
    request<PairResponse>({ url }, '/api/pair', { method: 'POST', body: JSON.stringify(body) }),
  status: (ep: Endpoint) => request<StatusResponse>(ep, '/api/status'),
  history: (ep: Endpoint, range: HistoryRange) =>
    request<{ range: string; points: MetricPoint[] | null }>(ep, `/api/history?range=${range}`),
  events: (ep: Endpoint, opts: { before?: number; limit?: number; minLevel?: MinLevel | 'all' }) => {
    const q = new URLSearchParams();
    if (opts.before) q.set('before', String(opts.before));
    q.set('limit', String(opts.limit ?? 50));
    if (opts.minLevel && opts.minLevel !== 'all') q.set('minLevel', opts.minLevel);
    return request<{ events: TweedleEvent[]; unseen: number }>(ep, `/api/events?${q}`);
  },
  seen: (ep: Endpoint, upTo: number) =>
    request<{ unseen: number }>(ep, '/api/events/seen', { method: 'POST', body: JSON.stringify({ upTo }) }),
  device: (ep: Endpoint) => request<Device>(ep, '/api/device'),
  updateDevice: (
    ep: Endpoint,
    patch: Partial<{ name: string; lang: string; pushToken: string; minLevel: MinLevel }>,
  ) => request<Device>(ep, '/api/device', { method: 'PUT', body: JSON.stringify(patch) }),
  unpair: (ep: Endpoint) => request<void>(ep, '/api/device', { method: 'DELETE' }),
};

export function liveUrl(url: string): string {
  return url.replace(/^http/i, 'ws') + '/api/live';
}
