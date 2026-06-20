-- Per-plan rate limiting via a 60s window count on usage_events (no Redis needed for v1).
-- Budget = plan.rate_per_sec * 60 per minute; defaults to 60/min if the user has no active sub.
CREATE OR REPLACE FUNCTION public.rate_check(_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, used BIGINT, lim INT, reset_seconds INT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  per_min INT;
  cnt BIGINT;
BEGIN
  SELECT COALESCE(p.rate_per_sec, 1) * 60 INTO per_min
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = _user_id AND s.status IN ('active', 'trialing')
  LIMIT 1;
  IF per_min IS NULL THEN per_min := 60; END IF;

  SELECT COUNT(*)::BIGINT INTO cnt
  FROM public.usage_events
  WHERE user_id = _user_id AND created_at > now() - interval '60 seconds';

  RETURN QUERY SELECT (cnt < per_min), cnt, per_min, 60;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.rate_check(uuid) FROM PUBLIC, anon, authenticated;
