import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { Environment, ApiConfig, RevertRequest, AccessTokenResponse, ApiError } from '../types';

// ─── JWT decoder (no verify — server already validates) ──────────────────────
interface JwtPayload {
  sub?: string;
  email?: string;
  [key: string]: unknown;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Usage Logger ────────────────────────────────────────────────────────────

export interface UsageLogEntry {
  environment: Environment;
  workflowType: 'credentialing' | 'facility';
  workflowId: string;
  organizationId: string;
  userId: string | null;
  userEmail: string | null;
  success: boolean;
  httpStatus: number;
  errorMessage: string | null;
  durationMs: number;
}

const LOG_ENDPOINT = import.meta.env.VITE_LOG_ENDPOINT as string | undefined;

export function logUsage(entry: UsageLogEntry): void {
  if (!LOG_ENDPOINT) {
    console.debug('[Logger] VITE_LOG_ENDPOINT not set — skipping usage log');
    return;
  }

  // Fire-and-forget: never awaited, never blocks the UI
  fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch((err) => {
    console.warn('[Logger] Failed to send usage log (non-critical):', err);
  });
}

export function buildLogEntry(
  token: string,
  environment: Environment,
  workflowType: 'credentialing' | 'facility',
  workflowId: string,
  organizationId: string,
  success: boolean,
  httpStatus: number,
  durationMs: number,
  errorMessage?: string
): UsageLogEntry {
  const jwt = decodeJwtPayload(token);
  return {
    environment,
    workflowType,
    workflowId,
    organizationId,
    userId:       jwt?.sub   ?? null,
    userEmail:    jwt?.email ?? null,
    success,
    httpStatus,
    errorMessage: errorMessage ?? null,
    durationMs,
  };
}

const STG_CONFIG: ApiConfig = {
  /** Same-origin path → Vite dev proxy locally, Vercel serverless `/api/users/access-token/[env].ts` in production */
  tokenUrl: '/api/users/access-token/stg',
  baseUrl: 'https://ng-api-stg.certifyos.com',
  credentialingRevert: '/credentialing-workflows/{id}/revert-status',
  facilityRevert: '/facility-credentialing-workflows/{id}/revert-status',
};

const PROD_CONFIG: ApiConfig = {
  tokenUrl: '/api/users/access-token/prod',
  baseUrl: 'https://ng-api-production.certifyos.com',
  credentialingRevert: '/credentialing-workflows/{id}/revert-status',
  facilityRevert: '/facility-credentialing-workflows/{id}/revert-status',
};

export function getApiConfig(environment: Environment): ApiConfig {
  return environment === 'stg' ? STG_CONFIG : PROD_CONFIG;
}

export function createApiClient(baseUrl: string, token: string, organizationId: string): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'organization-id': organizationId,
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
      return response;
    },
    (error: AxiosError) => {
      console.error('[API Error]', error.response?.status, error.message);
      return Promise.reject(error);
    }
  );

  return client;
}

export interface TokenFetchResult {
  token: string | null;
  errorType: 'cors' | 'network' | 'auth' | null;
  errorMessage: string | null;
}

export async function fetchAccessToken(environment: Environment): Promise<TokenFetchResult> {
  const config = getApiConfig(environment);
  try {
    const response = await axios.get<AccessTokenResponse>(config.tokenUrl, {
      withCredentials: true,
      timeout: 10000,
    });
    const accessToken = response.data.accessToken;
    if (!accessToken) {
      return {
        token: null,
        errorType: 'auth',
        errorMessage:
          'Certify responded with accessToken null. Hosted apps (such as revertapi.vercel.app) cannot use your certifyos.com login cookies—use Manual Input: open the access-token JSON in another tab while logged in, copy the JWT, paste here.',
      };
    }
    return {
      token: accessToken,
      errorType: null,
      errorMessage: null,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Failed to fetch access token:', error);

    // Typical when the browser blocks cross-origin scripts (calling CertifyOS directly instead of same-origin proxy)
    // or TLS / mixed-content issues outside dev / Vercel.
    if (!axiosError.response && axiosError.message?.includes('Network Error')) {
      return {
        token: null,
        errorType: 'cors',
        errorMessage:
          'This app could not reach the Certify OS token endpoint (often a cross-origin/network block when not using same-origin proxies). Deploy on Vercel with the bundled `/api` routes, open the access-token JSON in another tab while logged in, then use Manual Input below.',
      };
    }

    // Check for other specific errors
    if (axiosError.response?.status === 401) {
      return {
        token: null,
        errorType: 'auth',
        errorMessage: 'Not logged in. Please log into the CertifyOS platform first.',
      };
    }

    return {
      token: null,
      errorType: 'network',
      errorMessage: `Network error: ${axiosError.message}. Please check your connection.`,
    };
  }
}

export async function revertWorkflowStatus(
  environment: Environment,
  token: string,
  organizationId: string,
  workflowId: string,
  workflowType: 'credentialing' | 'facility',
  reason: string
): Promise<unknown> {
  const config = getApiConfig(environment);
  const client = createApiClient(config.baseUrl, token, organizationId);

  const endpoint = workflowType === 'credentialing'
    ? config.credentialingRevert.replace('{id}', workflowId)
    : config.facilityRevert.replace('{id}', workflowId);

  const requestBody: RevertRequest = { reason };

  const response = await client.patch(endpoint, requestBody);
  return response.data;
}

export function parseApiError(error: AxiosError): ApiError {
  const status = error.response?.status || 0;
  const data = error.response?.data as Record<string, unknown> | undefined;

  let message = 'An unexpected error occurred';

  switch (status) {
    case 401:
      message = 'Unauthorized - Please check your access token';
      break;
    case 403:
      message = 'Forbidden - You do not have permission to perform this action. Only Supervisors can revert workflows in certain statuses.';
      break;
    case 404:
      message = 'Workflow not found - Please verify the workflow ID';
      break;
    default:
      message = data?.message as string || error.message || `HTTP Error ${status}`;
  }

  return {
    status,
    message,
    details: data,
  };
}

export function generateCurlCommand(
  environment: Environment,
  token: string,
  organizationId: string,
  workflowId: string,
  workflowType: 'credentialing' | 'facility',
  reason: string
): string {
  const config = getApiConfig(environment);
  const endpoint = workflowType === 'credentialing'
    ? config.credentialingRevert.replace('{id}', workflowId)
    : config.facilityRevert.replace('{id}', workflowId);

  const fullUrl = `${config.baseUrl}${endpoint}`;

  return `curl -X PATCH \\\n  '${fullUrl}' \\\n  -H 'Authorization: Bearer ${token}' \\\n  -H 'organization-id: ${organizationId}' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"reason": "${reason}"}'`;
}
