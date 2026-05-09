import { useEffect, useRef } from 'react';

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
    if (!hash.startsWith('#token=')) return;

    const jwt = decodeURIComponent(hash.slice('#token='.length));
    if (!jwt || !jwt.startsWith('eyJ')) return;

    onToken(jwt);

    // Remove token from URL without a page reload
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [onToken]);
}
