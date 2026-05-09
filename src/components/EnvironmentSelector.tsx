import type { Environment } from '../types';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface EnvironmentSelectorProps {
  environment: Environment;
  onEnvironmentChange: (env: Environment) => void;
}

export function EnvironmentSelector({ environment, onEnvironmentChange }: EnvironmentSelectorProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors duration-200">
      <h2 className="text-lg font-semibold text-brand-midnight dark:text-white mb-4">Environment</h2>
      <div className="flex gap-4">
        <button
          onClick={() => onEnvironmentChange('stg')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg border-2 transition-all ${
            environment === 'stg'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400'
              : 'border-brand-gray-light dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500/50 text-brand-charcoal dark:text-gray-300'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <div className="text-left">
            <div className="font-semibold">STG (Staging)</div>
            <div className="text-sm opacity-75">For testing purposes</div>
          </div>
        </button>

        <button
          onClick={() => onEnvironmentChange('production')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg border-2 transition-all ${
            environment === 'production'
              ? 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
              : 'border-brand-gray-light dark:border-gray-700 hover:border-green-300 dark:hover:border-green-500/50 text-brand-charcoal dark:text-gray-300'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          <div className="text-left">
            <div className="font-semibold">Production</div>
            <div className="text-sm opacity-75">Live environment</div>
          </div>
        </button>
      </div>
    </div>
  );
}
