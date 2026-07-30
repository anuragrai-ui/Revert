import { useState, useCallback } from 'react';
import type { Environment, ApiError } from '../types';
import { markProvidersDelegated, parseApiError } from '../services/api';
import { AxiosError } from 'axios';
import { debugLog } from '../utils/debugLog';

interface UseMarkProvidersDelegatedReturn {
  isLoading: boolean;
  error: ApiError | null;
  response: unknown | null;
  durationMs: number | null;
  markDelegated: (
    token: string,
    organizationId: string,
    providerIds: string[],
    reason: string
  ) => Promise<void>;
  clearError: () => void;
  clearResponse: () => void;
}

export function useMarkProvidersDelegated(environment: Environment): UseMarkProvidersDelegatedReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [response, setResponse] = useState<unknown | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const markDelegated = useCallback(async (
    token: string,
    organizationId: string,
    providerIds: string[],
    reason: string
  ) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setDurationMs(null);

    const TAG = '[useMarkProvidersDelegated]';
    debugLog.info(`${TAG} Starting delegated provider update: env=${environment}, providers=${providerIds.length}, org=${organizationId}`);

    const startTime = Date.now();

    try {
      const result = await markProvidersDelegated(
        environment,
        token,
        organizationId,
        providerIds,
        reason
      );

      setResponse(result);
      setDurationMs(Date.now() - startTime);
      debugLog.info(`${TAG} Delegated provider update completed successfully.`);
    } catch (err) {
      const axiosError = err as AxiosError;
      const parsedError = parseApiError(axiosError);
      setError(parsedError);
      setDurationMs(Date.now() - startTime);
      debugLog.error(`${TAG} Delegated provider update failed: ${parsedError.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [environment]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResponse = useCallback(() => {
    setResponse(null);
  }, []);

  return {
    isLoading,
    error,
    response,
    durationMs,
    markDelegated,
    clearError,
    clearResponse,
  };
}
