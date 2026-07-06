-- PLAN P2.3 + P2.4 (closes audit P1-1: the uncapped free tier bleeding real per-call cost).
--
-- P2.3 trusted-read billing unit: a call is billable only when it returned a trusted
-- object (product present AND confidence >= the gate). A null / low-confidence read
-- costs the caller nothing, so we never charge for a miss. `billable` is stamped by
-- the API route from the response envelope.
ALTER TABLE public.usage_events
  ADD COLUMN IF NOT EXISTS billable BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.usage_events.billable IS 'True only when the response returned a trusted product (product present AND confidence >= 0.7). Quota and overage count billable reads only.';

CREATE INDEX IF NOT EXISTS usage_events_user_billable_created_idx
  ON public.usage_events (user_id, billable, created_at DESC);

-- P2.4 monthly quota + cost fuse. Enforced BEFORE the worker call so a free account
-- cannot run unbounded real-cost extractions. Returns the decision plus the numbers a
-- 402 response needs. Billing period = calendar month (UTC) for v1.
--   allowed          : may this call proceed
--   reason           : ok | quota_exceeded | cost_fuse
--   plan_id          : resolved plan
--   included_calls   : the plan's monthly trusted-read allowance
--   used_billable    : trusted reads so far this period
--   cost_spent_cents : total worker cost this period (cents), for the free cost fuse
CREATE OR REPLACE FUNCTION public.entitlement_check(_user_id UUID)
RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  plan_id TEXT,
  included_calls INT,
  used_billable BIGINT,
  cost_spent_cents NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_included INT;
  v_used BIGINT;
  v_cost NUMERIC;
  period_start TIMESTAMPTZ := date_trunc('month', now());
  -- Free tier cost fuse: cap real spend on a non-paying account at ~3x the notional
  -- included value ($0.02/call * 1000 = $20 -> fuse at 3000 cents).
  free_cost_fuse_cents CONSTANT NUMERIC := 3000;
BEGIN
  SELECT p.id, p.included_calls
    INTO v_plan, v_included
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = _user_id AND s.status IN ('active', 'trialing')
  LIMIT 1;

  IF v_plan IS NULL THEN
    SELECT p.id, p.included_calls INTO v_plan, v_included FROM public.plans p WHERE p.id = 'free';
  END IF;
  IF v_included IS NULL THEN v_included := 1000; END IF;

  SELECT COUNT(*) FILTER (WHERE billable),
         COALESCE(SUM(cost_usd) * 100, 0)
    INTO v_used, v_cost
  FROM public.usage_events
  WHERE user_id = _user_id AND created_at >= period_start;

  -- Free tier: hard-stop at the included allowance, and trip a cost fuse on spend.
  IF v_plan = 'free' THEN
    IF v_used >= v_included THEN
      RETURN QUERY SELECT false, 'quota_exceeded', v_plan, v_included, v_used, v_cost; RETURN;
    END IF;
    IF v_cost >= free_cost_fuse_cents THEN
      RETURN QUERY SELECT false, 'cost_fuse', v_plan, v_included, v_used, v_cost; RETURN;
    END IF;
  END IF;

  -- Paid tiers: never hard-blocked here (overage is metered to Stripe, P2.5).
  RETURN QUERY SELECT true, 'ok', v_plan, v_included, v_used, v_cost;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.entitlement_check(uuid) FROM PUBLIC, anon, authenticated;
