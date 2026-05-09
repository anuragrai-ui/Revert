import * as ff from '@google-cloud/functions-framework';
import { BigQuery } from '@google-cloud/bigquery';
import cors from 'cors';
import { IncomingMessage, ServerResponse } from 'http';

// ─── Types ──────────────────────────────────────────────────────────────────

interface UsageLogPayload {
  environment: 'stg' | 'production';
  workflowType: 'credentialing' | 'facility';
  workflowId: string;
  organizationId: string;
  userId: string | null;
  userEmail: string | null;
  success: boolean;
  httpStatus: number;
  errorMessage: string | null;
  durationMs: number;
}

interface BigQueryRow {
  timestamp: string;
  environment: string;
  workflow_type: string;
  workflow_id: string;
  organization_id: string;
  user_id: string | null;
  user_email: string | null;
  success: boolean;
  http_status: number;
  error_message: string | null;
  duration_ms: number;
  ip_address: string;
}

// ─── Config ─────────────────────────────────────────────────────────────────

const PROJECT_ID = process.env.GCP_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? '';
const DATASET_ID = process.env.BQ_DATASET_ID ?? 'certifyos_audit';
const TABLE_ID   = process.env.BQ_TABLE_ID   ?? 'workflow_revert_logs';

// Allowed origins for CORS — add your deployed frontend URL here
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',');

// ─── CORS middleware ─────────────────────────────────────────────────────────

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, Postman) or from allowed origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
});

function runCors(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return new Promise((resolve, reject) => {
    corsMiddleware(req as never, res as never, (err?: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ─── BigQuery client ─────────────────────────────────────────────────────────

const bigquery = new BigQuery({ projectId: PROJECT_ID || undefined });

// ─── Cloud Function entry point ──────────────────────────────────────────────

ff.http('logUsage', async (req: ff.Request, res: ff.Response) => {
  try {
    await runCors(req, res);
  } catch {
    res.status(403).json({ error: 'CORS not allowed' });
    return;
  }

  // Preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const payload = req.body as Partial<UsageLogPayload>;

  // Validate required fields
  if (!payload.workflowId || !payload.organizationId || !payload.environment || !payload.workflowType) {
    res.status(400).json({ error: 'Missing required fields: workflowId, organizationId, environment, workflowType' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim()
    ?? req.socket?.remoteAddress
    ?? 'unknown';

  const row: BigQueryRow = {
    timestamp:       new Date().toISOString(),
    environment:     payload.environment,
    workflow_type:   payload.workflowType,
    workflow_id:     payload.workflowId,
    organization_id: payload.organizationId,
    user_id:         payload.userId ?? null,
    user_email:      payload.userEmail ?? null,
    success:         payload.success ?? false,
    http_status:     payload.httpStatus ?? 0,
    error_message:   payload.errorMessage ?? null,
    duration_ms:     payload.durationMs ?? 0,
    ip_address:      ip,
  };

  try {
    await bigquery
      .dataset(DATASET_ID)
      .table(TABLE_ID)
      .insert([row]);

    console.log('[Logger] Row inserted:', JSON.stringify({ workflow_id: row.workflow_id, org: row.organization_id, success: row.success }));
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[Logger] BigQuery insert error:', err);
    res.status(500).json({ error: 'Failed to write to BigQuery' });
  }
});
