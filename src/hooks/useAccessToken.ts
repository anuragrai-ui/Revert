import { useState, useEffect, useCallback } from 'react';
import type { Environment } from '../types';
import { fetchAccessToken } from '../services/api';
import type { TokenFetchResult } from '../services/api';
import { debugLog } from '../utils/debugLog';
import { isTokenValid } from '../utils/jwt';

type ErrorType = 'cors' | 'network' | 'auth' | null;

const TAG = '[useAccessToken]';

const tokenCacheKey = (environment: Environment) => `revertapi_token_${environment}`;

function loadCachedToken(environment: Environment): string | null {
  try {
    const cached = localStorage.getItem(tokenCacheKey(environment));
    if (!cached) return null;
    if (isTokenValid(cached)) return cached;
    localStorage.removeItem(tokenCacheKey(environment));
    return null;
  } catch {
    return null;
  }
}

function cacheToken(environment: Environment, token: string): void {
  try {
    localStorage.setItem(tokenCacheKey(environment), token);
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — non-critical
  }
}

function clearCachedToken(environment: Environment): void {
  try {
    localStorage.removeItem(tokenCacheKey(environment));
  } catch {
    // ignore
  }
}

interface UseAccessTokenReturn {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  errorType: ErrorType;
  refreshToken: () => Promise<void>;
  setManualToken: (token: string) => void;
  clearToken: () => void;
}

export function useAccessToken(environment: Environment): UseAccessTokenReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType>(null);

  const refreshToken = useCallback(async () => {
    debugLog.info(`${TAG} refreshToken() env=${environment}`);
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const result: TokenFetchResult = await fetchAccessToken(environment);
      debugLog.info(`${TAG} result: hasToken=${!!result.token} len=${result.token?.length ?? 0} errType=${result.errorType}`);

      if (result.token) {
        setToken(result.token);
        cacheToken(environment, result.token);
        debugLog.info(`${TAG} Token SET (${result.token.length} chars)`);
      } else {
        setError(result.errorMessage || 'No access token received.');
        setErrorType(result.errorType);
        debugLog.warn(`${TAG} Token NOT set — errorType=${result.errorType}`);
      }
    } catch (err) {
      setError('Failed to fetch access token. Please check your connection and try again.');
      setErrorType('network');
      debugLog.error(`${TAG} Unexpected error: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [environment]);

  const setManualToken = useCallback((manualToken: string) => {
    debugLog.info(`${TAG} setManualToken() len=${manualToken.length}`);
    setToken(manualToken);
    setError(null);
    setErrorType(null);
    cacheToken(environment, manualToken);
  }, [environment]);

  const clearToken = useCallback(() => {
    debugLog.info(`${TAG} clearToken() env=${environment}`);
    setToken(null);
    clearCachedToken(environment);
  }, [environment]);

  // On mount and whenever the environment changes: try the cached token
  // first (survives page refreshes) before falling back to a live fetch.
  useEffect(() => {
    const cached = loadCachedToken(environment);
    if (cached) {
      debugLog.info(`${TAG} Restored cached token for env="${environment}" (${cached.length} chars)`);
      setToken(cached);
      setError(null);
      setErrorType(null);
      return;
    }

    debugLog.info(`${TAG} env changed to "${environment}", no valid cache — calling refreshToken()`);
    void Promise.resolve().then(() => refreshToken());
  }, [environment, refreshToken]);

  return {
    token,
    isLoading,
    error,
    errorType,
    refreshToken,
    setManualToken,
    clearToken,
  };
}
