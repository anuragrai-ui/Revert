import { useState, useCallback } from 'react';
import type { Environment, RevertFormData } from './types';
import { Layout } from './components/Layout';
import { EnvironmentSelector } from './components/EnvironmentSelector';
import { TokenManager } from './components/TokenManager';
import { WorkflowRevertForm } from './components/WorkflowRevertForm';
import { ResponseDisplay } from './components/ResponseDisplay';
import { useAccessToken } from './hooks/useAccessToken';
import { useWorkflowRevert } from './hooks/useWorkflowRevert';
import { generateCurlCommand } from './services/api';

function App() {
  const [environment, setEnvironment] = useState<Environment>('stg');
  const [curlCommand, setCurlCommand] = useState<string>('');

  const { token, isLoading: isTokenLoading, error: tokenError, errorType, refreshToken, setManualToken } = useAccessToken(environment);
  const { isLoading: isRevertLoading, error: revertError, response, revertWorkflow, clearError, clearResponse } = useWorkflowRevert(environment);

  const handleEnvironmentChange = useCallback((newEnv: Environment) => {
    setEnvironment(newEnv);
    clearError();
    clearResponse();
    setCurlCommand('');
  }, [clearError, clearResponse]);

  const handleSubmit = useCallback(async (formData: RevertFormData) => {
    if (!token) {
      return;
    }

    const curl = generateCurlCommand(
      environment,
      token,
      formData.organizationId,
      formData.workflowId,
      formData.workflowType,
      formData.reason
    );
    setCurlCommand(curl);

    await revertWorkflow(
      token,
      formData.organizationId,
      formData.workflowId,
      formData.workflowType,
      formData.reason
    );
  }, [environment, token, revertWorkflow]);

  return (
    <Layout environment={environment}>
      <EnvironmentSelector
        environment={environment}
        onEnvironmentChange={handleEnvironmentChange}
      />

      <TokenManager
        token={token}
        isLoading={isTokenLoading}
        error={tokenError}
        errorType={errorType}
        onRefresh={refreshToken}
        onManualToken={setManualToken}
      />

      <WorkflowRevertForm
        onSubmit={handleSubmit}
        isLoading={isRevertLoading}
        hasToken={!!token}
      />

      <ResponseDisplay
        response={response}
        error={revertError}
        curlCommand={curlCommand}
      />
    </Layout>
  );
}

export default App;
