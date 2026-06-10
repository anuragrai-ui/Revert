import { useState } from 'react';
import type { RevertFormData, WorkflowType, OperationType } from '../types';
import { AlertTriangle, X, CheckCircle, Building2, User, Shield, RefreshCw } from 'lucide-react';

interface ConfirmationDialogProps {
  formData: RevertFormData;
  environment: 'stg' | 'production';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  operation?: OperationType;
}

const WORKFLOW_TYPE_LABELS: Record<WorkflowType, string> = {
  credentialing: 'Credentialing Workflow',
  facility: 'Facility Workflow',
};

const WORKFLOW_TYPE_ICONS: Record<WorkflowType, React.ReactNode> = {
  credentialing: <User className="w-5 h-5" />,
  facility: <Building2 className="w-5 h-5" />,
};

export function ConfirmationDialog({
  formData,
  environment,
  onConfirm,
  onCancel,
  isLoading,
  operation = 'revert',
}: ConfirmationDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  const isValid = operation === 'revert'
    ? (formData.workflowId.trim() && formData.organizationId.trim() && formData.reason.trim())
    : (formData.workflowId.trim() && formData.organizationId.trim());

  if (!isValid) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Validation Error</h3>
          </div>
          <p className="text-brand-charcoal dark:text-gray-300 mb-4">
            Please fill in all required fields before proceeding.
          </p>
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isRevert = operation === 'revert';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {isRevert ? (
              <Shield className="w-6 h-6 text-brand-purple" />
            ) : (
              <RefreshCw className="w-6 h-6 text-brand-purple animate-spin-slow" />
            )}
            <h3 className="text-lg font-semibold text-brand-midnight dark:text-white">
              {isRevert ? 'Confirm Revert Action' : 'Confirm PSV PDF Generation'}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning banner */}
          <div className={isRevert 
            ? "p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg"
            : "p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg"
          }>
            <div className="flex items-start gap-3">
              <AlertTriangle className={isRevert 
                ? "w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5"
                : "w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5"
              } />
              <div className={isRevert 
                ? "text-sm text-red-700 dark:text-red-400"
                : "text-sm text-blue-700 dark:text-blue-300"
              }>
                <p className="font-semibold mb-1">
                  {isRevert ? 'Warning: This action cannot be undone' : 'Notice: PSV PDF generation enqueued'}
                </p>
                <p>
                  {isRevert 
                    ? 'Reverting a workflow status is a hard revert that removes the latest status. Only one step back is allowed at a time. Please verify all details carefully.'
                    : 'This triggers an asynchronous background generation task. The endpoint enqueues a Cloud Task which will process the generation. It takes a few minutes to complete.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-brand-charcoal dark:text-gray-300 uppercase tracking-wide">
              Action Summary
            </h4>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-brand-purple-light dark:bg-brand-purple-dark/20 rounded-lg">
                <div className="text-brand-purple dark:text-purple-400">
                  {WORKFLOW_TYPE_ICONS[formData.workflowType]}
                </div>
                <div>
                  <p className="text-xs text-brand-gray dark:text-gray-500 uppercase">Workflow Type</p>
                  <p className="font-medium text-brand-midnight dark:text-white">
                    {WORKFLOW_TYPE_LABELS[formData.workflowType]}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-brand-gray dark:text-gray-500 uppercase mb-1">Workflow ID</p>
                  <p className="font-medium text-brand-midnight dark:text-white font-mono text-sm">
                    {formData.workflowId}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-brand-gray dark:text-gray-500 uppercase mb-1">Organization ID</p>
                  <p className="font-medium text-brand-midnight dark:text-white font-mono text-sm">
                    {formData.organizationId}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-xs text-brand-gray dark:text-gray-500 uppercase mb-1">Environment</p>
                <p className="font-medium text-brand-midnight dark:text-white">
                  {environment === 'stg' ? 'Staging (STG)' : 'Production'}
                </p>
              </div>

              {isRevert && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-xs text-brand-gray dark:text-gray-500 uppercase mb-1">Reason</p>
                  <p className="text-brand-charcoal dark:text-gray-300 text-sm">{formData.reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Extra confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 text-brand-purple border-gray-300 rounded focus:ring-brand-purple"
            />
            <span className="text-sm text-brand-charcoal dark:text-gray-400">
              {isRevert 
                ? 'I have verified that all details are correct and understand this action will revert the workflow status by one step. This cannot be reversed.'
                : 'I have verified the Workflow ID and Organization ID, and I want to trigger a complete Primary Source Verification (PSV) PDF generation for this workflow.'
              }
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-brand-charcoal dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || isLoading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRevert ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-purple hover:bg-brand-purple-dark'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {isRevert ? 'Confirm Revert' : 'Generate PSV PDF'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
