import { useState } from 'react';
import type { ApiError } from '../types';
import { CheckCircle, XCircle, Terminal, Copy, Check, Clock } from 'lucide-react';

interface ResponseDisplayProps {
  response: unknown | null;
  error: ApiError | null;
  curlCommand: string;
  durationMs?: number | null;
}

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

export function ResponseDisplay({ response, error, curlCommand, durationMs }: ResponseDisplayProps) {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [showCurl, setShowCurl] = useState(true);

  const copyToClipboard = async (text: string, type: 'curl' | 'response') => {
    await navigator.clipboard.writeText(text);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const formatJson = (data: unknown): string => {
    return JSON.stringify(data, null, 2);
  };

  const formattedErrorDetails = error?.details ? formatJson(error.details) : '';
  const formattedResponse = response ? formatJson(response) : '';

  if (!response && !error) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-red-700">
              Error {error.status > 0 && `(${error.status})`}
            </span>
            {durationMs != null && (
              <span className="flex items-center gap-1 text-xs text-red-600 ml-2">
                <Clock className="w-3 h-3" />
                {formatDuration(durationMs)}
              </span>
            )}
          </div>
          <p className="text-red-700">{error.message}</p>
          {formattedErrorDetails && (
            <pre className="mt-3 p-3 bg-red-100 rounded text-sm text-red-800 overflow-auto">
              {formattedErrorDetails}
            </pre>
          )}
        </div>
      )}

      {response !== null && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-green-700">Success</span>
              <span className="flex items-center gap-1 text-xs text-green-600 ml-2">
                <Clock className="w-3 h-3" />
                {new Date().toLocaleTimeString()}
                {durationMs != null && ` · ${formatDuration(durationMs)}`}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(formatJson(response), 'response')}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              {copiedResponse ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedResponse ? 'Copied!' : 'Copy JSON'}
            </button>
          </div>
          <pre className="p-3 bg-green-100 rounded text-sm text-green-800 overflow-auto max-h-96">
            {formattedResponse}
          </pre>
        </div>
      )}

      <div className="bg-brand-charcoal rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-brand-gray-light" />
            <span className="font-semibold text-white">cURL Command</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCurl(!showCurl)}
              className="text-sm text-brand-gray-light hover:text-white"
            >
              {showCurl ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={() => copyToClipboard(curlCommand, 'curl')}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-brand-gray text-white rounded hover:bg-brand-charcoal transition-colors"
            >
              {copiedCurl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedCurl ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        {showCurl && (
          <pre className="p-3 bg-brand-midnight rounded text-sm text-green-400 overflow-auto font-mono">
            {curlCommand}
          </pre>
        )}
      </div>
    </div>
  );
}
