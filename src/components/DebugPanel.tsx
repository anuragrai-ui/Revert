import { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { debugLog } from '../utils/debugLog';
import type { LogEntry } from '../utils/debugLog';

const levelColor: Record<LogEntry['level'], string> = {
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
};

export function DebugPanel() {
  const [entries, setEntries] = useState<LogEntry[]>(debugLog.getEntries());
  const [open, setOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return debugLog.subscribe((newEntries) => {
      setEntries([...newEntries]);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="mt-4 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-900 text-sm font-mono text-brand-midnight dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Terminal className="w-4 h-4" />
          Debug Log ({entries.length})
        </span>
        {open && entries.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              debugLog.clear();
            }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 dark:hover:text-red-400"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </button>
      {open && (
        <div className="max-h-64 overflow-y-auto bg-gray-950 p-3 font-mono text-xs leading-relaxed">
          {entries.length === 0 ? (
            <p className="text-gray-500">No log entries yet. Interact with the token features to see logs here.</p>
          ) : (
            entries.map((entry, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-600 flex-shrink-0">{entry.time}</span>
                <span className={`flex-shrink-0 uppercase w-12 ${levelColor[entry.level]}`}>{entry.level}</span>
                <span className="text-gray-300 break-all">{entry.message}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
