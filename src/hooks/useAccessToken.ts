import { useState, useEffect, useCallback } from 'react';
import type { Environment } from '../types';
import { fetchAccessToken } from '../services/api';
import type { TokenFetchResult } from '../services/api';
import { debugLog } from '../utils/debugLog';

type ErrorType = 'cors' | 'network' | 'auth' | null;

const TAG = '[useAccessToken]';

interface UseAccessTokenReturn {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  errorType: ErrorType;
  refreshToken: () => Promise<void>;
  setManualToken: (token: string) => void;
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
  }, []);

  useEffect(() => {
    debugLog.info(`${TAG} env changed to "${environment}" — calling refreshToken()`);
    refreshToken();
  }, [refreshToken]);

  return {
    token,
    isLoading,
    error,
    errorType,
    refreshToken,
    setManualToken,
  };
}
