-- Security hardening pass. Supabase default privileges grant authenticated full-table SELECT on new
-- public tables, so protecting a column requires an explicit REVOKE before the column-level GRANT.

-- 1) Protect api_keys.key_hash: REVOKE all, then re-grant SELECT only on non-secret columns.
--    Key lifecycle (create/rotate/revoke) is service-role-only.
REVOKE ALL ON public.api_keys FROM anon, authenticated;
GRANT SELECT (id, user_id, name, prefix, last_four, last_used_at, revoked_at, created_at) ON public.api_keys TO authenticated;

-- 2) Pin search_path on the trigger helper that was missing it.
ALTER FUNCTION public.touch_updated_at() SET search_path = public;

-- 3) Tighten the admin profiles UPDATE policy (WITH CHECK was always-true).
DROP POLICY "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) SECURITY DEFINER helpers must not be callable by anon over /rest/v1/rpc.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.usage_current_period(uuid) FROM PUBLIC, anon;
