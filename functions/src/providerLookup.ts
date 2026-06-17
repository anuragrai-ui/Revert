import { BigQuery } from '@google-cloud/bigquery';

export interface CredentialingWorkflowProviderDetails {
  credentialing_workflows_id: string;
  organization_id: string;
  workflow_name: string | null;
  provider_first_name: string | null;
  provider_last_name: string | null;
  provider_npi: string | null;
}

export interface ProviderLookupQuery {
  query: string;
  params: {
    workflowId: string;
    organizationId: string;
  };
}

export function buildCredentialingWorkflowProviderLookupQuery(
  workflowId: string,
  organizationId: string
): ProviderLookupQuery {
  return {
    query: `
SELECT
  credentialing_workflows_id,
  organization_id,
  name AS workflow_name,
  provider_first_name,
  provider_last_name,
  provider_npi
FROM \`certifyos-production-platform.appdb_data.credentialing_workflows\`
WHERE credentialing_workflows_id = @workflowId
  AND organization_id = @organizationId
LIMIT 1
`.trim(),
    params: {
      workflowId,
      organizationId,
    },
  };
}

export async function getCredentialingWorkflowProviderDetails(
  bigquery: BigQuery,
  workflowId: string,
  organizationId: string
): Promise<CredentialingWorkflowProviderDetails | null> {
  const { query, params } = buildCredentialingWorkflowProviderLookupQuery(workflowId, organizationId);
  const [rows] = await bigquery.query({ query, params });
  const [providerDetails] = rows as CredentialingWorkflowProviderDetails[];

  return providerDetails ?? null;
}
