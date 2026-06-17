export type Environment = 'stg' | 'production';

export type OperationType = 'revert' | 'generatePsv' | 'markDelegated';

export interface ApiConfig {
  tokenUrl: string;
  baseUrl: string;
  realBaseUrl: string;
  credentialingRevert: string;
  facilityRevert: string;
  credentialingGeneratePsv: string;
  facilityGeneratePsv: string;
  markProvidersDelegated: string;
}

export interface RevertRequest {
  reason: string;
}

export interface MarkProvidersDelegatedRequest {
  providerIds: string[];
  reason: string;
}

export interface AccessTokenResponse {
  accessToken: string | null;
}

export interface RevertResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export type WorkflowType = 'credentialing' | 'facility';

export interface RevertFormData {
  workflowId: string;
  organizationId: string;
  reason: string;
  workflowType: WorkflowType;
  providerIds: string;
}
