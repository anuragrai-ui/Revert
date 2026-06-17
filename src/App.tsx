import { useState, useCallback } from 'react';
import type { Environment, RevertFormData, OperationType } from './types';
import { Layout } from './components/Layout';
import { EnvironmentSelector } from './components/EnvironmentSelector';
import { TokenManager } from './components/TokenManager';
import { WorkflowRevertForm } from './components/WorkflowRevertForm';
import { ResponseDisplay } from './components/ResponseDisplay';
import { useAccessToken } from './hooks/useAccessToken';
import { useWorkflowRevert } from './hooks/useWorkflowRevert';
import { usePsvGeneration } from './hooks/usePsvGeneration';
import { useMarkProvidersDelegated } from './hooks/useMarkProvidersDelegated';
import { useTokenFromHash } from './hooks/useTokenFromHash';
import { generateCurlCommand, generatePsvCurlCommand, generateMarkProvidersDelegatedCurlCommand } from './services/api';

function parseProviderIds(providerIds: string): string[] {
  return providerIds
    .split(/[\n,]+/)
    .map((providerId) => providerId.trim())
    .filter(Boolean);
}

function App() {
  const [environment, setEnvironment] = useState<Environment>('stg');
  const [activeOperation, setActiveOperation] = useState<OperationType>('revert');
  const [curlCommand, setCurlCommand] = useState<string>('');

  const { token, error: tokenError, setManualToken } = useAccessToken(environment);

  useTokenFromHash(setManualToken);

  const {
    isLoading: isRevertLoading,
    error: revertError,
    response: revertResponse,
    revertWorkflow,
    clearError: clearRevertError,
    clearResponse: clearRevertResponse,
  } = useWorkflowRevert(environment);

  const {
    isLoading: isPsvLoading,
    error: psvError,
    response: psvResponse,
    generatePsvPdf,
    clearError: clearPsvError,
    clearResponse: clearPsvResponse,
  } = usePsvGeneration(environment);

  const {
    isLoading: isMarkDelegatedLoading,
    error: markDelegatedError,
    response: markDelegatedResponse,
    markDelegated,
    clearError: clearMarkDelegatedError,
    clearResponse: clearMarkDelegatedResponse,
  } = useMarkProvidersDelegated(environment);

  const clearAllOutputs = useCallback(() => {
    clearRevertError();
    clearRevertResponse();
    clearPsvError();
    clearPsvResponse();
    clearMarkDelegatedError();
    clearMarkDelegatedResponse();
    setCurlCommand('');
  }, [
    clearRevertError,
    clearRevertResponse,
    clearPsvError,
    clearPsvResponse,
    clearMarkDelegatedError,
    clearMarkDelegatedResponse,
  ]);

  const handleEnvironmentChange = useCallback((newEnv: Environment) => {
    setEnvironment(newEnv);
    if (newEnv === 'stg' && activeOperation === 'generatePsv') {
      setActiveOperation('revert');
    }
    clearAllOutputs();
  }, [activeOperation, clearAllOutputs]);

  const handleOperationChange = useCallback((newOp: OperationType) => {
    if (environment === 'stg' && newOp === 'generatePsv') {
      return;
    }
    setActiveOperation(newOp);
    clearAllOutputs();
  }, [environment, clearAllOutputs]);

  const handleSubmit = useCallback(async (formData: RevertFormData) => {
    if (!token) {
      return;
    }

    if (activeOperation === 'revert') {
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
      return;
    }

    if (activeOperation === 'generatePsv') {
      const curl = generatePsvCurlCommand(
        environment,
        token,
        formData.organizationId,
        formData.workflowId,
        formData.workflowType
      );
      setCurlCommand(curl);

      await generatePsvPdf(
        token,
        formData.organizationId,
        formData.workflowId,
        formData.workflowType
      );
      return;
    }

    const providerIds = parseProviderIds(formData.providerIds);
    const curl = generateMarkProvidersDelegatedCurlCommand(
      environment,
      token,
      formData.organizationId,
      providerIds,
      formData.reason
    );
    setCurlCommand(curl);

    await markDelegated(
      token,
      formData.organizationId,
      providerIds,
      formData.reason
    );
  }, [environment, token, activeOperation, revertWorkflow, generatePsvPdf, markDelegated]);

  const isLoading = activeOperation === 'revert'
    ? isRevertLoading
    : activeOperation === 'generatePsv'
      ? isPsvLoading
      : isMarkDelegatedLoading;

  const response = activeOperation === 'revert'
    ? revertResponse
    : activeOperation === 'generatePsv'
      ? psvResponse
      : markDelegatedResponse;

  const error = activeOperation === 'revert'
    ? revertError
    : activeOperation === 'generatePsv'
      ? psvError
      : markDelegatedError;

  return (
    <Layout environment={environment} activeOperation={activeOperation}>
      <EnvironmentSelector
        environment={environment}
        onEnvironmentChange={handleEnvironmentChange}
      />

      <TokenManager
        environment={environment}
        token={token}
        error={tokenError}
        onManualToken={setManualToken}
      />

      <WorkflowRevertForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        hasToken={!!token}
        environment={environment}
        activeOperation={activeOperation}
        onOperationChange={handleOperationChange}
      />

      <ResponseDisplay
        response={response}
        error={error}
        curlCommand={curlCommand}
      />
    </Layout>
  );
}

export default App;
