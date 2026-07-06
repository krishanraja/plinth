-- PLAN P5.1: production monitoring of the North Star floor. A daily rollup of
-- usage_events, and an alert row when the trust rate crosses the KILL-CRITERIA floor
-- (below 0.60 with enough volume to be meaningful). Runs on pg_cron; delivery to a
-- channel (Resend email) is P5.3, wired when pg_net + the key are provisioned.

CREATE TABLE IF NOT EXISTS public.ops_daily (
  day DATE PRIMARY KEY,
  total_calls BIGINT NOT NULL DEFAULT 0,
  trusted_reads BIGINT NOT NULL DEFAULT 0,
  trust_rate NUMERIC,                 -- trusted_reads / total_calls (gate-pass rate)
  error_calls BIGINT NOT NULL DEFAULT 0,
  avg_latency_ms NUMERIC,
  total_cost_usd NUMERIC,
  active_accounts BIGINT NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ops_daily ENABLE ROW LEVEL SECURITY; -- service-role only

CREATE TABLE IF NOT EXISTS public.ops_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind TEXT NOT NULL,                 -- trust_floor | error_spike | ...
  day DATE,
  value NUMERIC,
  detail TEXT,
  delivered BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.ops_alerts ENABLE ROW LEVEL SECURITY; -- service-role only

-- Roll up one day of usage into ops_daily (idempotent upsert).
CREATE OR REPLACE FUNCTION public.compute_ops_daily(_day DATE DEFAULT (now() - interval '1 day')::date)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  d0 TIMESTAMPTZ := _day::timestamptz;
  d1 TIMESTAMPTZ := (_day + 1)::timestamptz;
BEGIN
  INSERT INTO public.ops_daily AS o (day, total_calls, trusted_reads, trust_rate, error_calls, avg_latency_ms, total_cost_usd, active_accounts, computed_at)
  SELECT
    _day,
    COUNT(*),
    COUNT(*) FILTER (WHERE billable),
    ROUND(COUNT(*) FILTER (WHERE billable)::numeric / NULLIF(COUNT(*), 0), 4),
    COUNT(*) FILTER (WHERE status >= 500 OR status = 0),
    ROUND(AVG(latency_ms), 1),
    ROUND(COALESCE(SUM(cost_usd), 0), 4),
    COUNT(DISTINCT user_id),
    now()
  FROM public.usage_events
  WHERE created_at >= d0 AND created_at < d1
  ON CONFLICT (day) DO UPDATE SET
    total_calls = EXCLUDED.total_calls,
    trusted_reads = EXCLUDED.trusted_reads,
    trust_rate = EXCLUDED.trust_rate,
    error_calls = EXCLUDED.error_calls,
    avg_latency_ms = EXCLUDED.avg_latency_ms,
    total_cost_usd = EXCLUDED.total_cost_usd,
    active_accounts = EXCLUDED.active_accounts,
    computed_at = now();
END;
$$;

-- KILL-CRITERIA floor check: trust rate below 0.60 over the trailing 7 days with at
-- least 10 calls writes exactly one alert per day (no duplicate spam).
CREATE OR REPLACE FUNCTION public.check_kill_floor()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_calls BIGINT;
  v_trusted BIGINT;
  v_rate NUMERIC;
  today DATE := now()::date;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE billable)
    INTO v_calls, v_trusted
  FROM public.usage_events
  WHERE created_at >= now() - interval '7 days';

  IF v_calls >= 10 THEN
    v_rate := ROUND(v_trusted::numeric / v_calls, 4);
    IF v_rate < 0.60 AND NOT EXISTS (
      SELECT 1 FROM public.ops_alerts WHERE kind = 'trust_floor' AND day = today
    ) THEN
      INSERT INTO public.ops_alerts (kind, day, value, detail)
      VALUES ('trust_floor', today, v_rate,
        format('7-day trust rate %s below the 0.60 kill floor over %s calls', v_rate, v_calls));
    END IF;
  END IF;
END;
$$;

-- The kill-conditions dashboard (MOAT.md section 6), the SQL-checkable signals in one
-- query so the monthly review is one call, not a project.
CREATE OR REPLACE FUNCTION public.kill_dashboard()
RETURNS TABLE(signal TEXT, value NUMERIC, red_threshold TEXT, status TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH w AS (
    SELECT COUNT(*) c, COUNT(*) FILTER (WHERE billable) t,
           COUNT(DISTINCT user_id) accts
    FROM public.usage_events WHERE created_at >= now() - interval '28 days'
  )
  SELECT 'live_trust_rate'::text,
         ROUND(t::numeric / NULLIF(c,0), 4),
         'below 0.60 = kill'::text,
         CASE WHEN c = 0 THEN 'no-data' WHEN t::numeric/NULLIF(c,0) < 0.60 THEN 'RED' ELSE 'ok' END
  FROM w
  UNION ALL
  SELECT 'active_accounts_28d', accts, '0 retained after GA+90d = kill',
         CASE WHEN accts = 0 THEN 'watch' ELSE 'ok' END FROM w
  UNION ALL
  SELECT 'outcome_reports_30d', (SELECT COUNT(*) FROM public.outcome_reports WHERE created_at >= now() - interval '30 days'),
         '~0 for 2 months post first design partner = moat not accumulating', 'watch'
  UNION ALL
  SELECT 'hard_domain_share', (SELECT ROUND(COUNT(*) FILTER (WHERE domain IN ('gtin:','name:') = false AND domain IS NOT NULL)::numeric / NULLIF(COUNT(*),0), 4) FROM public.usage_events WHERE created_at >= now() - interval '28 days'),
         'above ~0.50 to anti-bot head = wrong query mix', 'info';
$$;

REVOKE EXECUTE ON FUNCTION public.compute_ops_daily(date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_kill_floor() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.kill_dashboard() FROM PUBLIC, anon, authenticated;

-- Daily at 06:10 UTC: roll up yesterday, then check the floor.
SELECT cron.schedule('plinth-ops-daily', '10 6 * * *', $cron$
  SELECT public.compute_ops_daily();
  SELECT public.check_kill_floor();
$cron$);
