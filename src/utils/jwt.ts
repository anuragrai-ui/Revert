export interface DecodedJwt {
  [key: string]: unknown;
}

export function decodeJwtPayload(token: string): DecodedJwt | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as DecodedJwt;
  } catch {
    return null;
  }
}

/**
 * True if the JWT's `exp` claim is still in the future (minus a safety buffer).
 * Tokens without an `exp` claim are treated as valid — the server is the
 * final authority and will reject them with a 401 if they're bad.
 */
export function isTokenValid(token: string, bufferSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return true;
  return Date.now() / 1000 < exp - bufferSeconds;
}
