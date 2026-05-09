import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Same paths as vite dev proxy → Certify OS access-token (server-side avoids browser CORS). */
const UPSTREAM: Record<string, string> = {
  stg: 'https://ng-web.certifyos.com/api/users/access-token',
  prod: 'https://ng.certifyos.com/api/users/access-token',
};

function segmentEnv(req: VercelRequest): string | undefined {
  const q = req.query.env;
  if (typeof q === 'string') return q;
  if (Array.isArray(q) && q[0]) return q[0];
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Allow', 'GET').json({ message: 'Method not allowed' });
    return;
  }

  const envKey = segmentEnv(req);
  const target = envKey ? UPSTREAM[envKey] : undefined;
  if (!target || !envKey) {
    res.status(400).json({ message: 'Invalid token path', accessToken: null });
    return;
  }

  const cookieHeader = typeof req.headers.cookie === 'string' ? req.headers.cookie : '';
  const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined;

  try {
    const upstreamRes = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...(ua ? { 'User-Agent': ua } : {}),
      },
    });

    const text = await upstreamRes.text();
    const ct = upstreamRes.headers.get('content-type') ?? 'application/json; charset=utf-8';

    res.status(upstreamRes.status);
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(text);
  } catch {
    res.status(502).json({
      message: 'Upstream Certify OS token endpoint unreachable',
      accessToken: null,
    });
  }
}
