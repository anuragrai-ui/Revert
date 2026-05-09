import { useState, useEffect, useCallback } from 'react';
import type { Environment } from '../types';
import { fetchAccessToken } from '../services/api';
import type { TokenFetchResult } from '../services/api';

type ErrorType = 'cors' | 'network' | 'auth' | null;

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
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const result: TokenFetchResult = await fetchAccessToken(environment);
      if (result.token) {
        setToken(result.token);
      } else {
        setError(result.errorMessage || 'No access token received.');
        setErrorType(result.errorType);
      }
    } catch (err) {
      setError('Failed to fetch access token. Please check your connection and try again.');
      setErrorType('network');
      console.error('Token fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [environment]);

  const setManualToken = useCallback((manualToken: string) => {
    setToken(manualToken);
    setError(null);
    setErrorType(null);
  }, []);

  useEffect(() => {
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
