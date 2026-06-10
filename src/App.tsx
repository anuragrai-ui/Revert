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
import { useTokenFromHash } from './hooks/useTokenFromHash';
import { generateCurlCommand, generatePsvCurlCommand } from './services/api';

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

  const clearAllOutputs = useCallback(() => {
    clearRevertError();
    clearRevertResponse();
    clearPsvError();
    clearPsvResponse();
    setCurlCommand('');
  }, [clearRevertError, clearRevertResponse, clearPsvError, clearPsvResponse]);

  const handleEnvironmentChange = useCallback((newEnv: Environment) => {
    setEnvironment(newEnv);
    if (newEnv === 'stg') {
      setActiveOperation('revert');
    }
    clearAllOutputs();
  }, [clearAllOutputs]);

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
    } else {
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
    }
  }, [environment, token, activeOperation, revertWorkflow, generatePsvPdf]);

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
        isLoading={activeOperation === 'revert' ? isRevertLoading : isPsvLoading}
        hasToken={!!token}
        environment={environment}
        activeOperation={activeOperation}
        onOperationChange={handleOperationChange}
      />

      <ResponseDisplay
        response={activeOperation === 'revert' ? revertResponse : psvResponse}
        error={activeOperation === 'revert' ? revertError : psvError}
        curlCommand={curlCommand}
      />
    </Layout>
  );
}

export default App;
