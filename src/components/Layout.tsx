import { useState, useEffect } from 'react';
import { FileText, Moon, Sun } from 'lucide-react';
import type { Environment, OperationType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  environment: Environment;
  activeOperation?: OperationType;
}

export function Layout({ children, environment, activeOperation = 'revert' }: LayoutProps) {
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

  const apiDocsUrl = activeOperation === 'generatePsv'
    ? (environment === 'production'
      ? 'https://ng-api-production.certifyos.com/api/certifyos-dev/#/Internal/CredentialingWorkflowsController_generatePsv'
      : 'https://ng-api-stg.certifyos.com/api/certifyos-dev/#/Internal/CredentialingWorkflowsController_generatePsv')
    : (environment === 'production'
      ? 'https://ng-api-production.certifyos.com/api/certifyos-dev/#/credentialing-workflows/CredentialingWorkflowsController_revertStatus'
      : 'https://ng-api-stg.certifyos.com/api/certifyos-dev/#/credentialing-workflows/CredentialingWorkflowsController_revertStatus');

  return (
    <div className="min-h-screen bg-brand-ivory dark:bg-gray-900 font-sans transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-brand-gray-light dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex shrink-0 items-center justify-center p-1">
                {/* URL-safe filenames (avoid + / spaces breaking on CDN) */}
                <img src={`${import.meta.env.BASE_URL}certifyos-logo-light.png`} alt="CertifyOS" width={160} height={32} className="h-8 w-auto max-w-[10rem] object-contain object-left dark:hidden" decoding="async" />
                <img src={`${import.meta.env.BASE_URL}certifyos-logo-dark.png`} alt="CertifyOS" width={160} height={32} className="hidden h-8 w-auto max-w-[10rem] object-contain object-left dark:block" decoding="async" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-brand-midnight dark:text-white truncate sm:whitespace-normal">Workflow Self-Service</h1>
                <p className="text-sm text-brand-charcoal dark:text-gray-400 max-w-xl">Credentialing &amp; Facility workflow actions</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
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
