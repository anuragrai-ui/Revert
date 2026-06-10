import { useState, useCallback } from 'react';
import type { Environment, WorkflowType, ApiError } from '../types';
import { generatePsv, parseApiError } from '../services/api';
import { AxiosError } from 'axios';
import { debugLog } from '../utils/debugLog';

interface UsePsvGenerationReturn {
  isLoading: boolean;
  error: ApiError | null;
  response: unknown | null;
  generatePsvPdf: (
    token: string,
    organizationId: string,
    workflowId: string,
    workflowType: WorkflowType
  ) => Promise<void>;
  clearError: () => void;
  clearResponse: () => void;
}

export function usePsvGeneration(environment: Environment): UsePsvGenerationReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [response, setResponse] = useState<unknown | null>(null);

  const generatePsvPdf = useCallback(async (
    token: string,
    organizationId: string,
    workflowId: string,
    workflowType: WorkflowType
  ) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const TAG = '[usePsvGeneration]';
    debugLog.info(`${TAG} Starting PSV generation: env=${environment}, type=${workflowType}, id=${workflowId}, org=${organizationId}`);

    try {
      const result = await generatePsv(
        environment,
        token,
        organizationId,
        workflowId,
        workflowType
      );

      setResponse(result);
      debugLog.info(`${TAG} PSV generation successfully triggered (202 Accepted).`);
    } catch (err) {
      const axiosError = err as AxiosError;
      const parsedError = parseApiError(axiosError);
      setError(parsedError);
      debugLog.error(`${TAG} PSV generation failed: ${parsedError.message}`);
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
    generatePsvPdf,
    clearError,
    clearResponse,
  };
}
