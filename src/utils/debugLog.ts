type LogListener = (entries: LogEntry[]) => void;

export interface LogEntry {
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

const MAX_ENTRIES = 100;
let entries: LogEntry[] = [];
let listeners: LogListener[] = [];

function now(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 } as Intl.DateTimeFormatOptions);
}

function push(level: LogEntry['level'], message: string): void {
  const entry: LogEntry = { time: now(), level, message };
  entries = [...entries.slice(-(MAX_ENTRIES - 1)), entry];
  listeners.forEach((fn) => fn(entries));
}

export const debugLog = {
  info: (msg: string) => push('info', msg),
  warn: (msg: string) => push('warn', msg),
  error: (msg: string) => push('error', msg),
  getEntries: () => entries,
  subscribe: (fn: LogListener) => {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },
  clear: () => {
    entries = [];
    listeners.forEach((fn) => fn(entries));
  },
};
