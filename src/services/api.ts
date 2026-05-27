import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { Environment, ApiConfig, RevertRequest, AccessTokenResponse, ApiError } from '../types';
import { debugLog } from '../utils/debugLog';

// ─── JWT decoder (no verify — server already validates) ──────────────────────
interface JwtPayload {
  [key: string]: unknown;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(decoded) as JwtPayload;
    
    // Log decoded payload to the Debug Log panel (excluding signature or sensitive token parts)
    debugLog.info(`[JWT Decoder] Decoded JWT claims: ${JSON.stringify(payload)}`);
    console.log('[JWT Decoder] Decoded JWT claims:', payload);
    
    return payload;
  } catch (err) {
    debugLog.error(`[JWT Decoder] Failed to decode JWT payload: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

function extractUserId(jwt: JwtPayload | null): string | null {
  if (!jwt) return null;
  
  // 1. Try common claims for User ID / Subject
  let val = 
    jwt.sub ?? 
    jwt.id ?? 
    jwt.uid ?? 
    jwt.userId ?? 
    jwt.user_id ?? 
    (jwt.user as Record<string, unknown> | undefined)?.id ?? 
    (jwt.user as Record<string, unknown> | undefined)?.userId ?? 
    (jwt.user as Record<string, unknown> | undefined)?.user_id;

  if (val) return String(val);

  // 2. Scan all keys for namespaced or custom user ID keys (e.g. "https://certifyos.com/user_id")
  for (const key of Object.keys(jwt)) {
    const lowerKey = key.toLowerCase();
    if (
      key.endsWith('/id') || 
      key.endsWith('/userId') || 
      key.endsWith('/user_id') || 
      key.endsWith('/sub') ||
      lowerKey === 'userid' ||
      lowerKey === 'user_id'
    ) {
      return String(jwt[key]);
    }
  }

  return null;
}

function extractUserEmail(jwt: JwtPayload | null): string | null {
  if (!jwt) return null;
  
  // 1. Try common claims for User Email
  let val = 
    jwt.email ?? 
    jwt.email_address ?? 
    jwt.user_email ?? 
    jwt.userEmail ?? 
    jwt.upn ?? 
    jwt.unique_name ?? 
    (jwt.user as Record<string, unknown> | undefined)?.email ?? 
    (jwt.user as Record<string, unknown> | undefined)?.email_address ?? 
    (jwt.user as Record<string, unknown> | undefined)?.user_email ?? 
    (jwt.user as Record<string, unknown> | undefined)?.userEmail;

  if (val) return String(val);

  // 2. Scan all keys for any namespaced custom claims ending with '/email' (e.g. "https://certifyos.com/email")
  for (const key of Object.keys(jwt)) {
    const lowerKey = key.toLowerCase();
    if (
      key.endsWith('/email') || 
      key.endsWith('/email_address') || 
      key.endsWith('/user_email') || 
      key.endsWith('/useremail') ||
      lowerKey === 'email' ||
      lowerKey === 'emailaddress' ||
      lowerKey === 'useremail' ||
      lowerKey === 'user_email'
    ) {
      return String(jwt[key]);
    }
  }

  return null;
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

const LOG_ENDPOINT = (import.meta.env.VITE_LOG_ENDPOINT as string | undefined) 
  || 'https://certifyos-revert-logger-106861691435.us-central1.run.app/';

export function logUsage(entry: UsageLogEntry): void {
  if (!LOG_ENDPOINT) {
    console.debug('[Logger] VITE_LOG_ENDPOINT not set — skipping usage log');
    debugLog.warn('[Logger] VITE_LOG_ENDPOINT not set — skipping usage log');
    return;
  }

  debugLog.info(`[Logger] Sending usage log...`);

  // Fire-and-forget: never awaited, never blocks the UI
  fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  })
    .then(async (res) => {
      if (res.ok) {
        debugLog.info('[Logger] Usage log recorded successfully.');
      } else {
        const text = await res.text();
        debugLog.error(`[Logger] Log endpoint returned error ${res.status}: ${text}`);
        console.error(`[Logger] Log endpoint returned error ${res.status}:`, text);
      }
    })
    .catch((err) => {
      debugLog.error(`[Logger] Failed to send usage log: ${err instanceof Error ? err.message : String(err)}`);
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
  const userId = extractUserId(jwt);
  const userEmail = extractUserEmail(jwt);

  debugLog.info(`[Logger] Resolved User ID: "${userId || 'unknown'}", Email: "${userEmail || 'unknown'}" from JWT`);

  return {
    environment,
    workflowType,
    workflowId,
    organizationId,
    userId,
    userEmail,
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
  const TAG = '[fetchAccessToken]';

  debugLog.info(`${TAG} env=${environment} tokenUrl=${config.tokenUrl}`);
  debugLog.info(`${TAG} origin=${typeof window !== 'undefined' ? window.location.origin : 'SSR'}`);
  console.log(`${TAG} env=${environment} tokenUrl=${config.tokenUrl}`);

  try {
    const response = await axios.get<AccessTokenResponse>(config.tokenUrl, {
      withCredentials: true,
      timeout: 10000,
    });

    debugLog.info(`${TAG} HTTP ${response.status}`);
    debugLog.info(`${TAG} response keys: ${Object.keys(response.data).join(', ')}`);
    debugLog.info(`${TAG} accessToken type=${typeof response.data.accessToken}, value=${response.data.accessToken ? String(response.data.accessToken).substring(0, 20) + '...' : 'NULL'}`);
    console.log(`${TAG} HTTP ${response.status}`, response.data);

    const accessToken = response.data.accessToken;
    if (!accessToken) {
      debugLog.warn(`${TAG} Token is null — cookies not forwarded to this domain`);
      return {
        token: null,
        errorType: 'auth',
        errorMessage:
          'CertifyOS returned accessToken: null — your session cookies are not available on this domain. Use the bookmarklet (one click) or paste a token manually.',
      };
    }

    debugLog.info(`${TAG} Token acquired (${accessToken.length} chars)`);
    return {
      token: accessToken,
      errorType: null,
      errorMessage: null,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    const errDetail = `msg=${axiosError.message} code=${axiosError.code} status=${axiosError.response?.status} hasResponse=${!!axiosError.response}`;
    debugLog.error(`${TAG} FAILED: ${errDetail}`);
    console.error(`${TAG} FAILED`, axiosError);

    if (!axiosError.response && axiosError.message?.includes('Network Error')) {
      return {
        token: null,
        errorType: 'cors',
        errorMessage:
          'Could not reach the CertifyOS token endpoint (cross-origin block). Use the bookmarklet or paste a token manually.',
      };
    }

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
