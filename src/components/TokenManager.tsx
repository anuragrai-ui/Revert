import { useState, useMemo } from 'react';
import type { Environment } from '../types';
import { RefreshCw, Key, CheckCircle, AlertCircle, Edit2, X, Bookmark, ExternalLink } from 'lucide-react';
import { generateBookmarkletCode, getBookmarkletLabel } from '../utils/bookmarklet';
import { DebugPanel } from './DebugPanel';

type ErrorType = 'cors' | 'network' | 'auth' | null;

const ACCESS_TOKEN_DOC_URL: Record<Environment, string> = {
  stg: 'https://ng-web.certifyos.com/api/users/access-token',
  production: 'https://ng.certifyos.com/api/users/access-token',
};

interface TokenManagerProps {
  environment: Environment;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  errorType: ErrorType;
  onRefresh: () => void;
  onManualToken: (token: string) => void;
}

export function TokenManager({
  environment,
  token,
  isLoading,
  error,
  errorType,
  onRefresh,
  onManualToken,
}: TokenManagerProps) {
  const manualTokenHref = ACCESS_TOKEN_DOC_URL[environment];
  const [showManualInput, setShowManualInput] = useState(false);
  const [showBookmarkletGuide, setShowBookmarkletGuide] = useState(false);
  const [manualTokenValue, setManualTokenValue] = useState('');

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const bookmarkletHref = useMemo(
    () => generateBookmarkletCode(appOrigin, environment),
    [appOrigin, environment]
  );
  const bookmarkletLabel = getBookmarkletLabel(environment);

  const getTokenPreview = (t: string): string => {
    if (t.length <= 25) return t;
    return `${t.substring(0, 10)}...${t.substring(t.length - 10)}`;
  };

  const handleManualSubmit = () => {
    if (manualTokenValue.trim()) {
      onManualToken(manualTokenValue.trim());
      setShowManualInput(false);
      setManualTokenValue('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-200">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-brand-midnight dark:text-white flex items-center gap-2">
          <Key className="w-5 h-5 flex-shrink-0" />
          Access Token
        </h2>
        <div className="flex flex-wrap gap-2">
          {!showManualInput && (
            <button
              onClick={() => setShowManualInput(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-brand-gray-light dark:bg-gray-700 text-brand-charcoal dark:text-gray-300 rounded-lg hover:bg-brand-gray-light/80 dark:hover:bg-gray-600 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Paste Token
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Fetching...' : 'Auto Fetch'}
          </button>
        </div>
      </div>

      {/* Bookmarklet one-click solution */}
      <div className="mb-4 rounded-lg border border-brand-purple/20 bg-brand-purple-light dark:border-brand-purple/40 dark:bg-brand-purple-dark/20 px-4 py-4">
        <div className="flex items-start gap-3">
          <Bookmark className="w-5 h-5 text-brand-purple dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-brand-midnight dark:text-white text-sm mb-1">
              One-Click Token (Recommended)
            </p>
            <p className="text-sm text-brand-charcoal dark:text-gray-300 mb-3">
              Drag the button below to your bookmarks bar. Then click it on any CertifyOS page — it grabs your token and opens this app with it pre-filled.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {/* The actual draggable bookmarklet link */}
              <a
                href={bookmarkletHref}
                onClick={(e) => e.preventDefault()}
                draggable
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-brand-purple-dark transition-colors select-none"
                title="Drag me to your bookmarks bar!"
              >
                <Bookmark className="w-4 h-4" />
                {bookmarkletLabel}
              </a>

              <button
                onClick={() => setShowBookmarkletGuide((v) => !v)}
                className="text-sm text-brand-purple dark:text-purple-400 underline hover:text-brand-purple-dark dark:hover:text-purple-300"
              >
                {showBookmarkletGuide ? 'Hide guide' : 'How does this work?'}
              </button>
            </div>

            {showBookmarkletGuide && (
              <ol className="mt-3 ml-1 space-y-1.5 text-sm text-brand-charcoal dark:text-gray-400 list-decimal list-inside">
                <li>
                  <strong>Drag</strong> the purple &ldquo;{bookmarkletLabel}&rdquo; button to your bookmarks bar.
                </li>
                <li>
                  Open any CertifyOS page (
                  <a href="https://ng-web.certifyos.com" target="_blank" rel="noopener noreferrer" className="text-brand-purple underline dark:text-purple-400">
                    STG
                  </a>{' '}
                  or{' '}
                  <a href="https://ng.certifyos.com" target="_blank" rel="noopener noreferrer" className="text-brand-purple underline dark:text-purple-400">
                    Prod
                  </a>
                  ) and <strong>log in</strong>.
                </li>
                <li>
                  <strong>Click</strong> the bookmark. It fetches your token from the same CertifyOS origin (cookies included) and opens this app with it.
                </li>
                <li>
                  Done! The token is loaded automatically — no copy-paste needed.
                </li>
              </ol>
            )}
          </div>
        </div>
      </div>

      {/* Manual input section */}
      {showManualInput && (
        <div className="mb-4 p-4 bg-brand-purple-light dark:bg-brand-purple-dark/20 border border-brand-purple/20 dark:border-brand-purple/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium text-brand-purple-dark dark:text-brand-purple-light">Paste Token</label>
            <button
              onClick={() => setShowManualInput(false)}
              className="text-brand-purple dark:text-brand-purple-light hover:text-brand-purple-dark dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-brand-charcoal dark:text-gray-400 mb-3">
            Open{' '}
            <a
              href={manualTokenHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-brand-purple underline font-medium hover:text-brand-purple-dark dark:text-purple-400 dark:hover:text-purple-300"
            >
              access-token JSON <ExternalLink className="w-3 h-3" />
            </a>{' '}
            in a new tab (while logged into CertifyOS), copy the <code className="rounded bg-black/5 px-1 font-mono text-xs dark:bg-white/10">accessToken</code> value, and paste below.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualTokenValue}
              onChange={(e) => setManualTokenValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="eyJhbGciOi..."
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-brand-gray-light dark:border-gray-700 text-brand-midnight dark:text-white rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm font-mono"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualTokenValue.trim()}
              className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Set
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
            {(errorType === 'cors' || errorType === 'auth') && (
              <p className="mt-2 text-red-600 dark:text-red-500">
                Use the <strong>bookmarklet</strong> above (recommended) or <strong>Paste Token</strong> to provide a token.
              </p>
            )}
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
      ) : (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            <span className="text-yellow-700 dark:text-yellow-400">
              {isLoading ? 'Fetching token...' : 'No token available.'}
            </span>
          </div>
          {!isLoading && !error && (
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
              Use the bookmarklet above, or click "Paste Token" to provide your JWT.
            </p>
          )}
        </div>
      )}

      {/* Debug log panel */}
      <DebugPanel />
    </div>
  );
}
