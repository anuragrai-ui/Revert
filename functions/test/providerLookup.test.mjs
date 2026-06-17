import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCredentialingWorkflowProviderLookupQuery } from '../dist/providerLookup.js';

describe('credentialing workflow provider lookup query', () => {
  it('queries provider details by workflow and organization using BigQuery parameters', () => {
    const workflowId = 'workflow-123';
    const organizationId = 'org-456';

    const { query, params } = buildCredentialingWorkflowProviderLookupQuery(workflowId, organizationId);

    assert.match(
      query,
      /FROM `certifyos-production-platform\.appdb_data\.credentialing_workflows`/
    );
    assert.match(query, /credentialing_workflows_id/);
    assert.match(query, /organization_id/);
    assert.match(query, /name AS workflow_name/);
    assert.match(query, /provider_first_name/);
    assert.match(query, /provider_last_name/);
    assert.match(query, /provider_npi/);
    assert.match(query, /credentialing_workflows_id = @workflowId/);
    assert.match(query, /organization_id = @organizationId/);
    assert.equal(params.workflowId, workflowId);
    assert.equal(params.organizationId, organizationId);
    assert.equal(query.includes(workflowId), false);
    assert.equal(query.includes(organizationId), false);
  });
});
