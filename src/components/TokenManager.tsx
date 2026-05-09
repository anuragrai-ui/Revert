import { useState } from 'react';
import type { Environment } from '../types';
import { RefreshCw, Key, CheckCircle, AlertCircle, Edit2, X } from 'lucide-react';

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
  const [manualTokenValue, setManualTokenValue] = useState('');

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

  const isCorsError = errorType === 'cors';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-brand-midnight dark:text-white flex items-center gap-2">
          <Key className="w-5 h-5" />
          Access Token
        </h2>
        <div className="flex gap-2">
          {!showManualInput && (
            <button
              onClick={() => setShowManualInput(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-gray-light dark:bg-gray-700 text-brand-charcoal dark:text-gray-300 rounded-lg hover:bg-brand-gray-light/80 dark:hover:bg-gray-600 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Manual Input
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Fetching...' : 'Auto Fetch'}
          </button>
        </div>
      </div>

      {showManualInput && (
        <div className="mb-4 p-4 bg-brand-purple-light dark:bg-brand-purple-dark/20 border border-brand-purple/20 dark:border-brand-purple/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium text-brand-purple-dark dark:text-brand-purple-light">Paste Token from Browser</label>
            <button
              onClick={() => setShowManualInput(false)}
              className="text-brand-purple dark:text-brand-purple-light hover:text-brand-purple-dark dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-brand-purple dark:text-brand-purple-light mb-3">
            Open{' '}
            <a
              href={manualTokenHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium hover:text-brand-purple-dark dark:hover:text-white"
            >
              this link
            </a>{' '}
            in a new tab, copy the accessToken value, and paste it here.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualTokenValue}
              onChange={(e) => setManualTokenValue(e.target.value)}
              placeholder="Paste token here (eyJhbGciOi...)"
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-brand-gray-light dark:border-gray-700 text-brand-midnight dark:text-white rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none text-sm font-mono"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualTokenValue.trim()}
              className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Set Token
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${isCorsError ? 'bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30' : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30'}`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isCorsError ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'}`} />
          <div className={`text-sm ${isCorsError ? 'text-orange-700 dark:text-orange-400' : 'text-red-700 dark:text-red-400'}`}>
            {error}
            {isCorsError && (
              <div className="mt-2 text-sm text-orange-600 dark:text-orange-500">
                <strong>Tip:</strong> Use <strong>Manual Input</strong> above — log into CertifyOS, open the access-token URL in another tab, copy the JWT, and paste here.
              </div>
            )}
          </div>
        </div>
      )}

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
              Click "Auto Fetch" to try automatic fetching, or use "Manual Input" to paste the token directly.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
