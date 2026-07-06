-- PLAN P4.1 + P4.2 + MOAT: make the North Star computable from production data, and
-- open the one label channel a competitor cannot manufacture (outcome closure).
--
-- North Star (canonical): weekly high-confidence (>=gate) calls per active account.
-- Moat metric: trust rate = share of calls at/above gate that are actually CORRECT,
-- which only the golden eval or outcome closure can establish (never gate-pass alone).

-- Weekly trusted reads per account (the North Star). Billable = trusted (P2.3).
CREATE OR REPLACE FUNCTION public.northstar_weekly(_since TIMESTAMPTZ DEFAULT now() - interval '8 weeks')
RETURNS TABLE(user_id UUID, week DATE, trusted_reads BIGINT, total_calls BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ue.user_id,
         date_trunc('week', ue.created_at)::date AS week,
         COUNT(*) FILTER (WHERE ue.billable) AS trusted_reads,
         COUNT(*) AS total_calls
  FROM public.usage_events ue
  WHERE ue.created_at >= _since
  GROUP BY ue.user_id, date_trunc('week', ue.created_at)
  ORDER BY week DESC, trusted_reads DESC;
$$;

-- Gate-pass rate by extraction method over a window. This is NOT the moat metric: it
-- is how often the gate passed, not how often it was right. The metrics page must show
-- it next to precision-at-gate (from golden_eval_runs) and never conflate the two.
CREATE OR REPLACE FUNCTION public.trust_rate_by_method(_since TIMESTAMPTZ DEFAULT now() - interval '30 days')
RETURNS TABLE(method TEXT, calls BIGINT, gate_pass BIGINT, gate_pass_rate NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(split_part(ue.domain, ':', 1), 'unknown') AS method,
         COUNT(*) AS calls,
         COUNT(*) FILTER (WHERE ue.billable) AS gate_pass,
         ROUND(COUNT(*) FILTER (WHERE ue.billable)::numeric / NULLIF(COUNT(*), 0), 4) AS gate_pass_rate
  FROM public.usage_events ue
  WHERE ue.created_at >= _since AND ue.confidence IS NOT NULL
  GROUP BY 1 ORDER BY calls DESC;
$$;

-- Golden eval runs: the moat metric (measured precision at gate) recorded pre-release,
-- surfaced next to live gate-pass so the two are never confused (P4.2).
CREATE TABLE IF NOT EXISTS public.golden_eval_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  calibration_version TEXT,
  split TEXT,
  n INT,
  precision_at_gate NUMERIC,
  precision_wilson_low NUMERIC,
  recall_jsonld NUMERIC,
  recall_shopify NUMERIC,
  recall_gtin NUMERIC,
  adversarial_rejection NUMERIC,
  ece NUMERIC,
  notes TEXT
);
ALTER TABLE public.golden_eval_runs ENABLE ROW LEVEL SECURITY; -- service-role only, no policies

-- MOAT: outcome-closure reports. The ONLY label class a competitor cannot crawl, buy,
-- or self-adjudicate, because it exists only downstream of a real agent acting on a
-- real Plinth answer. Keyed on request_id (join to usage_events) and/or plinth_id.
CREATE TABLE IF NOT EXISTS public.outcome_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id TEXT,
  plinth_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('purchased', 'price_matched', 'price_mismatch', 'out_of_stock', 'wrong_product', 'other')),
  observed_price NUMERIC,
  observed_currency TEXT,
  note TEXT
);
CREATE INDEX IF NOT EXISTS outcome_reports_request_idx ON public.outcome_reports (request_id) WHERE request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS outcome_reports_plinth_idx ON public.outcome_reports (plinth_id) WHERE plinth_id IS NOT NULL;
ALTER TABLE public.outcome_reports ENABLE ROW LEVEL SECURITY;
-- Owners can insert and read their own outcome reports; nothing else.
CREATE POLICY outcome_reports_own_insert ON public.outcome_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY outcome_reports_own_select ON public.outcome_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

REVOKE EXECUTE ON FUNCTION public.northstar_weekly(timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trust_rate_by_method(timestamptz) FROM PUBLIC, anon, authenticated;
