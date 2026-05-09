import type { Environment } from '../types';
import { debugLog } from './debugLog';

const TOKEN_URLS: Record<Environment, string> = {
  stg: 'https://ng-web.certifyos.com/api/users/access-token',
  production: 'https://ng.certifyos.com/api/users/access-token',
};

/**
 * Opens the CertifyOS access-token page in a new tab.
 */
export function openTokenPage(env: Environment): void {
  const url = TOKEN_URLS[env];
  debugLog.info(`[openTokenPage] Opening ${url}`);
  window.open(url, '_blank');
}

/**
 * Returns the full `javascript:` bookmarklet string the user can save
 * as a browser bookmark. When executed on any certifyos.com page, it
 * fetches the token (same-origin, cookies included) and redirects to
 * the Revert app with #token=<jwt>.
 *
 * React blocks javascript: hrefs, so this string is meant to be copied
 * to clipboard and manually added as a bookmark URL.
 */
export function generateBookmarkletCode(appUrl: string, env: Environment): string {
  const tokenUrl = TOKEN_URLS[env];

  const raw = `(function(){
  fetch('${tokenUrl}',{credentials:'include'})
    .then(function(r){return r.json()})
    .then(function(d){
      var t=d.accessToken;
      if(!t){alert('Token is null — make sure you are logged in to CertifyOS');return;}
      window.open('${appUrl}#token='+encodeURIComponent(t),'_blank');
    })
    .catch(function(e){alert('Failed: '+e.message);});
})();`;

  return 'javascript:' + raw.replace(/\n\s*/g, '');
}

/**
 * Copy text to clipboard, returning true on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    debugLog.info('[copyToClipboard] Copied to clipboard');
    return true;
  } catch {
    debugLog.warn('[copyToClipboard] Clipboard API failed, trying fallback');
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      debugLog.error('[copyToClipboard] All copy methods failed');
      return false;
    }
  }
}
