import { useState, useEffect } from 'react';
import { FileText, Moon, Sun } from 'lucide-react';
import type { Environment } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  environment: Environment;
}

export function Layout({ children, environment }: LayoutProps) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const apiDocsUrl = environment === 'production'
    ? 'https://ng-api-production.certifyos.com/api/certifyos-dev/#/credentialing-workflows/CredentialingWorkflowsController_revertStatus'
    : 'https://ng-api-stg.certifyos.com/api/certifyos-dev/#/credentialing-workflows/CredentialingWorkflowsController_revertStatus';

  return (
    <div className="min-h-screen bg-brand-ivory dark:bg-gray-900 font-sans transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-brand-gray-light dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center p-1 bg-white dark:bg-gray-800 rounded-lg">
                <img src="/CertifyOS%20LockUp%20Deep%20Purple%20+%20Charcoal.png" alt="CertifyOS Logo" className="h-8 dark:hidden block" />
                <img src="/CertifyOS%20LockUp%20Lavender%20Tint%20+%20White.png" alt="CertifyOS Logo" className="h-8 hidden dark:block" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-brand-midnight dark:text-white">Workflow Revert</h1>
                <p className="text-sm text-brand-gray dark:text-gray-400">Credentialing & Facility Workflow Status Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href={apiDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-charcoal dark:text-gray-300 hover:text-brand-purple dark:hover:text-brand-purple-light transition-colors underline decoration-transparent hover:decoration-brand-purple"
              >
                <FileText className="w-4 h-4" />
                API Docs
              </a>
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-brand-gray-light dark:border-gray-700 bg-white dark:bg-gray-800 mt-auto transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <p className="text-sm text-brand-gray dark:text-gray-400 text-center">
            Use with caution. All revert actions are recorded in the audit trail.
          </p>
        </div>
      </footer>
    </div>
  );
}
