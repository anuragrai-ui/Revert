import { useState, useCallback } from 'react';
import type { ProviderDetails } from '../types';
import { fetchProviderDetails } from '../services/api';

export interface UseProviderLookupReturn {
  isLoading: boolean;
  error: string | null;
  providerDetails: ProviderDetails | null;
  lookupProvider: (workflowId: string, organizationId: string) => Promise<void>;
  clearDetails: () => void;
}

export function useProviderLookup(): UseProviderLookupReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [providerDetails, setProviderDetails] = useState<ProviderDetails | null>(null);

  const lookupProvider = useCallback(async (workflowId: string, organizationId: string) => {
    if (!workflowId.trim() || !organizationId.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setProviderDetails(null);

    try {
      const details = await fetchProviderDetails(workflowId, organizationId);
      if (!details) {
        setError('No provider details found for the given IDs.');
      } else {
        setProviderDetails(details);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch provider details from BigQuery.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearDetails = useCallback(() => {
    setProviderDetails(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    providerDetails,
    lookupProvider,
    clearDetails,
  };
}
