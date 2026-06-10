import { useState, useEffect } from 'react';
import type { WorkflowType, RevertFormData, Environment, OperationType } from '../types';
import { Building2, User, Send, AlertTriangle, Undo2, RefreshCw, HelpCircle } from 'lucide-react';
import { ConfirmationDialog } from './ConfirmationDialog';

interface WorkflowRevertFormProps {
  onSubmit: (data: RevertFormData) => void;
  isLoading: boolean;
  hasToken: boolean;
  environment: Environment;
  activeOperation: OperationType;
  onOperationChange: (operation: OperationType) => void;
}

const WORKFLOW_TYPE_OPTIONS: { value: WorkflowType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'credentialing',
    label: 'Credentialing Workflow',
    icon: <User className="w-5 h-5" />,
    description: 'For individual provider credentialing workflows',
  },
  {
    value: 'facility',
    label: 'Facility Workflow',
    icon: <Building2 className="w-5 h-5" />,
    description: 'For facility/organization credentialing workflows',
  },
];

export function WorkflowRevertForm({
  onSubmit,
  isLoading,
  hasToken,
  environment,
  activeOperation,
  onOperationChange,
}: WorkflowRevertFormProps) {
  const [formData, setFormData] = useState<RevertFormData>({
    workflowId: '',
    organizationId: localStorage.getItem('organizationId') || '',
    reason: '',
    workflowType: 'credentialing',
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const savedOrgId = localStorage.getItem('organizationId');
    if (savedOrgId) {
      setFormData(prev => ({ ...prev, organizationId: savedOrgId }));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('organizationId', formData.organizationId);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    onSubmit(formData);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  const updateField = <K extends keyof RevertFormData>(field: K, value: RevertFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isRevert = activeOperation === 'revert';

  const isValid = isRevert
    ? (formData.workflowId.trim() && formData.organizationId.trim() && formData.reason.trim())
    : (formData.workflowId.trim() && formData.organizationId.trim());

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
      {/* Operation Tabs */}
      <div className="flex border-b border-brand-gray-light dark:border-gray-700 mb-6">
        <button
          type="button"
          onClick={() => onOperationChange('revert')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            isRevert
              ? 'border-brand-purple text-brand-purple dark:text-purple-400'
              : 'border-transparent text-brand-gray hover:text-brand-charcoal dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Undo2 className="w-4 h-4" />
          Revert Status
        </button>
        <button
          type="button"
          onClick={() => onOperationChange('generatePsv')}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all ${
            !isRevert
              ? 'border-brand-purple text-brand-purple dark:text-purple-400'
              : 'border-transparent text-brand-gray hover:text-brand-charcoal dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate PSV PDF
        </button>
      </div>

      <h2 className="text-lg font-semibold text-brand-midnight dark:text-white mb-4">
        {isRevert ? 'Revert Workflow Status' : 'Regenerate Primary Source Verification (PSV)'}
      </h2>

      {/* Info Boxes based on Operation */}
      {isRevert ? (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Important Revert Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Only one step back at a time (hard revert).</li>
                <li>Regular users can revert: Not Started &larr; PSV Ready.</li>
                <li>Supervisors can revert: Approved, Denied, Tabled, Committee, Withdrawn/Cancelled.</li>
                <li>Cannot revert if provider has another active workflow.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-brand-purple dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-700 dark:text-indigo-300">
              <p className="font-medium mb-1">Important PSV Generation Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Async background task:</strong> The request enqueues a Cloud Task on the platform which executes the PDF generation asynchronously.</li>
                <li>The API returns a <code>202 Accepted</code> immediately (typically &lt;200 ms). Please allow a few minutes for completion.</li>
                <li><strong>When to use:</strong> Use this if fields are appearing blank on the PSV report (e.g. CAQH details, dates, or Medical Director), or if a bulk status change (such as bulk withdrawal) bypassed the automatic PSV generation.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-brand-charcoal dark:text-gray-300 mb-2">Workflow Type</label>
          <div className="grid grid-cols-2 gap-4">
            {WORKFLOW_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateField('workflowType', option.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.workflowType === option.value
                    ? 'border-brand-purple bg-brand-purple-light dark:bg-brand-purple-dark/30 text-brand-purple-dark dark:text-brand-purple-light'
                    : 'border-brand-gray-light dark:border-gray-700 hover:border-brand-purple/50 text-brand-gray dark:text-gray-400'
                }`}
              >
                {option.icon}
                <span className="font-medium">{option.label}</span>
                <span className="text-xs opacity-75 text-center">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="workflowId" className="block text-sm font-medium text-brand-charcoal dark:text-gray-300 mb-1">
              Workflow ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="workflowId"
              value={formData.workflowId}
              onChange={(e) => updateField('workflowId', e.target.value)}
              placeholder="Enter workflow ID"
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-brand-gray-light dark:border-gray-700 text-brand-midnight dark:text-white rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="organizationId" className="block text-sm font-medium text-brand-charcoal dark:text-gray-300 mb-1">
              Organization ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="organizationId"
              value={formData.organizationId}
              onChange={(e) => updateField('organizationId', e.target.value)}
              placeholder="Enter organization ID"
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-brand-gray-light dark:border-gray-700 text-brand-midnight dark:text-white rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none"
              required
            />
            <p className="text-xs text-brand-gray dark:text-gray-400 mt-1">Saved automatically for convenience</p>
          </div>
        </div>

        {isRevert && (
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-brand-charcoal dark:text-gray-300 mb-1">
              Reason for Revert <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => updateField('reason', e.target.value)}
              placeholder="e.g., TS-12345 — reverting to previous status per client request"
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-brand-gray-light dark:border-gray-700 text-brand-midnight dark:text-white rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-brand-purple outline-none resize-none"
              required
            />
            <p className="text-xs text-brand-gray dark:text-gray-400 mt-1">
              Include the support ticket number (e.g., TS-12345) for audit trail purposes
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid || isLoading || !hasToken}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-lg disabled:opacity-50 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed transition-colors ${
            isRevert
              ? 'bg-brand-yellow hover:bg-brand-yellow-hover text-black'
              : 'bg-brand-purple hover:bg-brand-purple-dark text-white'
          }`}
        >
          {isRevert ? <Send className="w-5 h-5" /> : <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />}
          {isLoading ? 'Processing...' : (isRevert ? 'Revert Status' : 'Regenerate PSV')}
        </button>

        {!hasToken && (
          <p className="text-center text-sm text-red-600">
            Please fetch an access token before submitting
          </p>
        )}
      </form>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <ConfirmationDialog
          formData={formData}
          environment={environment}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={isLoading}
          operation={activeOperation}
        />
      )}
    </div>
  );
}
