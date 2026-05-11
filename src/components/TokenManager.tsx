import { useState, useCallback } from 'react';
import type { Environment } from '../types';
import { Key, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { openTokenPage } from '../utils/bookmarklet';

interface TokenManagerProps {
  environment: Environment;
  token: string | null;
  error: string | null;
  onManualToken: (token: string) => void;
}

export function TokenManager({
  environment,
  token,
  error,
  onManualToken,
}: TokenManagerProps) {
  const [pasteValue, setPasteValue] = useState('');

  const getTokenPreview = (t: string): string => {
    if (t.length <= 25) return t;
    return `${t.substring(0, 10)}...${t.substring(t.length - 10)}`;
  };

  const handlePasteSubmit = useCallback(() => {
    const trimmed = pasteValue.trim();
    if (!trimmed) return;
    onManualToken(trimmed);
    setPasteValue('');
  }, [pasteValue, onManualToken]);

  const handleGetToken = useCallback(() => {
    openTokenPage(environment);
  }, [environment]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-brand-midnight dark:text-white flex items-center gap-2">
          <Key className="w-5 h-5 flex-shrink-0" />
          Access Token
        </h2>
      </div>

      {/* Primary flow: Open token page + paste */}
      {!token && (
        <div className="mb-4 rounded-lg border border-brand-purple/20 bg-brand-purple-light dark:border-brand-purple/40 dark:bg-brand-purple-dark/20 p-4">
          <p className="text-sm font-semibold text-brand-midnight dark:text-white mb-2">
            Get Token from CertifyOS
          </p>
          <ol className="text-sm text-brand-charcoal dark:text-gray-400 space-y-1.5 mb-3 list-decimal list-inside">
            <li>Make sure you're <strong>logged in</strong> to CertifyOS ({environment === 'stg' ? 'STG' : 'Production'}).</li>
            <li>Click the button below — it opens the token JSON page in a new tab.</li>
            <li>Copy the <code className="rounded bg-black/5 px-1 font-mono text-xs dark:bg-white/10">accessToken</code> value (the long string starting with <code className="rounded bg-black/5 px-1 font-mono text-xs dark:bg-white/10">eyJ...</code>).</li>
            <li>Paste it in the field below.</li>
          </ol>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={handleGetToken}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Token Page ({environment === 'stg' ? 'STG' : 'Prod'})
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasteSubmit()}
              placeholder="Paste accessToken here (eyJhbGciOi...)"
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-brand-gray-light dark:border-gray-700 text-brand-midnight dark:text-white rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm font-mono"
            />
            <button
              onClick={handlePasteSubmit}
              disabled={!pasteValue.trim()}
              className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Set Token
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 rounded-lg flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
          <div className="text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Token status */}
      {token ? (
        <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
            <span className="font-medium text-green-700 dark:text-green-400">Token Active</span>
          </div>
          <div className="font-mono text-sm text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/50 p-2 rounded break-all">
            {getTokenPreview(token)}
          </div>
          <p className="text-xs text-green-600 dark:text-green-500 mt-2">
            Token is valid for 24 hours. Refresh if you encounter authentication errors.
          </p>
        </div>
      ) : !error && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            <span className="text-yellow-700 dark:text-yellow-400">No token yet.</span>
          </div>
        </div>
      )}
    </div>
  );
}
