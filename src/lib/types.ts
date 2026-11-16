// Mirrors the JSON of the Tweedle API (github.com/impiperl/Tweedle).

export type Level = 'ok' | 'info' | 'warn' | 'error';
export type MinLevel = 'info' | 'warn' | 'error' | 'none';

export interface DiskStat {
  mount: string;
  device: string;
  fstype: string;
  total: number;
  used: number;
  usedPct: number;
  inodesPct: number;
}

export interface SystemStat {
  time: string;
  hostname: string;
  uptime: number;
  cpuPct: number;
  cores: number;
  load1: number;
  load5: number;
  load15: number;
  memTotal: number;
  memUsed: number;
  memPct: number;
  swapTotal: number;
  swapUsed: number;
  swapPct: number;
  disks: DiskStat[] | null;
  netRxRate: number;
  netTxRate: number;
}

export interface ProcStatus {
  name: string;
  exe: string;
  cmdline?: string;
  minCount: number;
  count: number;
  pids: number[] | null;
  cpuPct: number;
  rss: number;
  level: Level;
}

export interface ContainerStatus {
  name: string;
  image: string;
  state: string;
  status: string;
  health: string;
  restarts: number;
  startedAt: number;
  found: boolean;
  level: Level;
}

export interface CertStatus {
  name: string;
  target: string;
  notAfter?: string;
  daysLeft: number;
  issuer?: string;
  error?: string;
  checked: string;
  level: Level;
}

export interface EndpointStatus {
  name: string;
  url: string;
  status?: number;
  latencyMs: number;
  error?: string;
  checked: string;
  level: Level;
}

export interface Snapshot {
  server: string;
  system: SystemStat | null;
  processes: ProcStatus[] | null;
  containers: ContainerStatus[] | null;
  certs: CertStatus[] | null;
  endpoints: EndpointStatus[] | null;
  podmanError?: string;
  levels: Record<string, Level>;
}

export interface StatusResponse {
  status: Snapshot | null;
  unseen: number;
  version: string;
}

export interface MetricPoint {
  t: string;
  cpu: number;
  mem: number;
  swap: number;
  load1: number;
  netRx: number;
  netTx: number;
  disks: Record<string, number> | null;
}

export interface TweedleEvent {
  id: number;
  time: string;
  key: string;
  level: Level;
  code: string;
  params: Record<string, string> | null;
  seen: boolean;
  message: string;
}

export interface Device {
  id: number;
  name: string;
  lang: string;
  pushToken: string;
  minLevel: MinLevel;
  created: string;
  lastSeen: string;
}

export type HistoryRange = '1h' | '6h' | '24h' | '7d';

const rank: Record<Level, number> = { ok: 0, info: 1, warn: 2, error: 3 };

export function worst(levels: Iterable<Level>): Level {
  let w: Level = 'ok';
  for (const l of levels) if (rank[l] > rank[w]) w = l;
  return w;
}

export function snapshotLevel(s: Snapshot | null | undefined): Level {
  return s ? worst(Object.values(s.levels ?? {})) : 'ok';
}
