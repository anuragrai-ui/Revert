-- ─────────────────────────────────────────────────────────────────────────────
-- CertifyOS Workflow Revert — BigQuery Setup
-- Run these once in the BigQuery console or via `bq` CLI
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create dataset (if it doesn't exist)
CREATE SCHEMA IF NOT EXISTS `your-project-id.certifyos_audit`
OPTIONS (
  location = 'US',
  description = 'CertifyOS internal tooling audit logs'
);

-- 2. Create the usage log table
CREATE TABLE IF NOT EXISTS `your-project-id.certifyos_audit.workflow_revert_logs` (
  timestamp       TIMESTAMP NOT NULL,
  environment     STRING    NOT NULL,   -- 'stg' | 'production'
  workflow_type   STRING    NOT NULL,   -- 'credentialing' | 'facility'
  workflow_id     STRING    NOT NULL,
  organization_id STRING    NOT NULL,
  user_id         STRING,              -- JWT sub claim (nullable)
  user_email      STRING,              -- JWT email claim (nullable)
  success         BOOL      NOT NULL,
  http_status     INT64     NOT NULL,
  error_message   STRING,              -- null on success
  duration_ms     INT64     NOT NULL,  -- API call round-trip time in ms
  ip_address      STRING    NOT NULL   -- Cloud Function sees the real IP
)
PARTITION BY DATE(timestamp)           -- partitioned by day for cost efficiency
OPTIONS (
  description              = 'Audit log for every workflow revert API call made via the internal tool',
  require_partition_filter = false
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Useful queries
-- ─────────────────────────────────────────────────────────────────────────────

-- Total calls per user (last 30 days)
SELECT
  user_email,
  user_id,
  COUNT(*)                                    AS total_calls,
  COUNTIF(success)                            AS successful_calls,
  COUNTIF(NOT success)                        AS failed_calls,
  ROUND(AVG(duration_ms))                     AS avg_duration_ms
FROM `your-project-id.certifyos_audit.workflow_revert_logs`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY user_email, user_id
ORDER BY total_calls DESC;

-- Activity per organization (last 7 days)
SELECT
  organization_id,
  environment,
  COUNT(*)             AS total_reverts,
  COUNTIF(success)     AS successful,
  COUNTIF(NOT success) AS failed
FROM `your-project-id.certifyos_audit.workflow_revert_logs`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY organization_id, environment
ORDER BY total_reverts DESC;

-- Daily usage trend
SELECT
  DATE(timestamp)      AS day,
  environment,
  COUNT(*)             AS calls,
  COUNTIF(success)     AS successful
FROM `your-project-id.certifyos_audit.workflow_revert_logs`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
GROUP BY day, environment
ORDER BY day DESC;

-- All calls for a specific workflow ID
SELECT *
FROM `your-project-id.certifyos_audit.workflow_revert_logs`
WHERE workflow_id = 'REPLACE_WITH_WORKFLOW_ID'
ORDER BY timestamp DESC;

-- Failed calls with error details
SELECT
  timestamp,
  user_email,
  organization_id,
  workflow_id,
  workflow_type,
  http_status,
  error_message
FROM `your-project-id.certifyos_audit.workflow_revert_logs`
WHERE success = false
ORDER BY timestamp DESC
LIMIT 100;
