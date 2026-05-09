import { useEffect, useRef } from 'react';
import { debugLog } from '../utils/debugLog';

const TAG = '[useTokenFromHash]';

/**
 * On mount, checks window.location.hash for `#token=<jwt>`.
 * If found, calls `onToken(jwt)`, then strips the hash so the
 * token never lingers in the address bar or browser history.
 */
export function useTokenFromHash(onToken: (jwt: string) => void): void {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const hash = window.location.hash;
    debugLog.info(`${TAG} hash="${hash.substring(0, 40)}${hash.length > 40 ? '...' : ''}"`);

    if (!hash.startsWith('#token=')) {
      debugLog.info(`${TAG} No #token= prefix — skipping`);
      return;
    }

    const jwt = decodeURIComponent(hash.slice('#token='.length));
    debugLog.info(`${TAG} JWT length=${jwt.length} prefix="${jwt.substring(0, 20)}..."`);

    if (!jwt) {
      debugLog.warn(`${TAG} JWT empty after decode — skipping`);
      return;
    }

    if (!jwt.startsWith('eyJ')) {
      debugLog.warn(`${TAG} JWT doesn't start with "eyJ" — got "${jwt.substring(0, 10)}". Skipping.`);
      return;
    }

    debugLog.info(`${TAG} Valid JWT — calling onToken()`);
    onToken(jwt);

    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    debugLog.info(`${TAG} Hash cleared from URL`);
  }, [onToken]);
}
