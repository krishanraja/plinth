-- Harden usage_current_period: it was SECURITY DEFINER taking an arbitrary _user_id,
-- which let any signed-in user read another user's usage. Bind to auth.uid() internally.
CREATE OR REPLACE FUNCTION public.usage_current_period(_user_id UUID DEFAULT NULL)
RETURNS TABLE(calls BIGINT, cost_usd NUMERIC, cached_calls BIGINT, live_calls BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COUNT(*)::BIGINT AS calls,
    COALESCE(SUM(cost_usd), 0)::NUMERIC AS cost_usd,
    COUNT(*) FILTER (WHERE cached)::BIGINT AS cached_calls,
    COUNT(*) FILTER (WHERE NOT cached)::BIGINT AS live_calls
  FROM public.usage_events
  WHERE user_id = auth.uid()
    AND created_at >= date_trunc('month', now());
$$;
