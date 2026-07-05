-- PLAN F0.7 (+ MOAT wire-in): every metered call becomes a calibration observation.
-- Adds the response-truth columns to usage_events so the North Star (weekly >=gate
-- calls per account) and per-domain reliability are computable from production data.

ALTER TABLE public.usage_events
  ADD COLUMN IF NOT EXISTS request_id TEXT,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(5, 4),
  ADD COLUMN IF NOT EXISTS product_returned BOOLEAN,
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS envelope_hash TEXT,
  ADD COLUMN IF NOT EXISTS calibration_version TEXT;

COMMENT ON COLUMN public.usage_events.request_id IS 'Worker request id, the join key for outcome-closure reports';
COMMENT ON COLUMN public.usage_events.confidence IS 'Overall confidence stamped on the returned envelope (null when the response was not a well-formed envelope)';
COMMENT ON COLUMN public.usage_events.product_returned IS 'True when the envelope carried a non-null product object';
COMMENT ON COLUMN public.usage_events.domain IS 'Hostname of the requested URL, or gtin:/name: for non-URL inputs; per-domain reliability keys on this';
COMMENT ON COLUMN public.usage_events.envelope_hash IS 'SHA-256 of the raw response body, audit-trail anchor';
COMMENT ON COLUMN public.usage_events.calibration_version IS 'Version of the calibration fit that produced the confidence (null until P1.5 ships)';

-- The North Star query pattern filters on confidence and time per user.
CREATE INDEX IF NOT EXISTS usage_events_user_created_conf_idx
  ON public.usage_events (user_id, created_at DESC, confidence);

-- Per-domain reliability rollups.
CREATE INDEX IF NOT EXISTS usage_events_domain_idx
  ON public.usage_events (domain) WHERE domain IS NOT NULL;
