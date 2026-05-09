import { useState, useCallback } from 'react';
import type { Environment, WorkflowType, ApiError } from '../types';
import { revertWorkflowStatus, parseApiError, logUsage, buildLogEntry } from '../services/api';
import { AxiosError } from 'axios';

interface UseWorkflowRevertReturn {
  isLoading: boolean;
  error: ApiError | null;
  response: unknown | null;
  revertWorkflow: (
    token: string,
    organizationId: string,
    workflowId: string,
    workflowType: WorkflowType,
    reason: string
  ) => Promise<void>;
  clearError: () => void;
  clearResponse: () => void;
}

export function useWorkflowRevert(environment: Environment): UseWorkflowRevertReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [response, setResponse] = useState<unknown | null>(null);

  const revertWorkflow = useCallback(async (
    token: string,
    organizationId: string,
    workflowId: string,
    workflowType: WorkflowType,
    reason: string
  ) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const startTime = Date.now();

    try {
      const result = await revertWorkflowStatus(
        environment,
        token,
        organizationId,
        workflowId,
        workflowType,
        reason
      );
      const durationMs = Date.now() - startTime;

      setResponse(result);

      // Fire-and-forget usage log — success
      logUsage(buildLogEntry(
        token, environment, workflowType, workflowId, organizationId,
        true, 200, durationMs
      ));
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const axiosError = err as AxiosError;
      const parsedError = parseApiError(axiosError);
      setError(parsedError);

      // Fire-and-forget usage log — failure
      logUsage(buildLogEntry(
        token, environment, workflowType, workflowId, organizationId,
        false,
        axiosError.response?.status ?? 0,
        durationMs,
        parsedError.message
      ));
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
    revertWorkflow,
    clearError,
    clearResponse,
  };
}
