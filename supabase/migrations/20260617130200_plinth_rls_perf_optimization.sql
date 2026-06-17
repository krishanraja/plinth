-- Production-grade RLS + index pass.
--  * Wrap auth.uid() in (select auth.uid()) so it is evaluated once per query, not per row (auth_rls_initplan).
--  * Consolidate duplicate permissive SELECT policies into single OR policies (multiple_permissive_policies).
--  * Split public-capture admin "FOR ALL" into SELECT/UPDATE/DELETE so the public INSERT policy stands alone.
--  * Add covering indexes for foreign keys.

-- ============ PROFILES ============
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING ((select auth.uid()) = id OR public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id OR public.has_role((select auth.uid()), 'admin'))
  WITH CHECK ((select auth.uid()) = id OR public.has_role((select auth.uid()), 'admin'));

-- ============ USER_ROLES ============
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR public.has_role((select auth.uid()), 'admin'));

-- ============ WAITLIST ============
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins manage waitlist" ON public.waitlist;
CREATE POLICY "waitlist_insert_public" ON public.waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "waitlist_admin_select" ON public.waitlist FOR SELECT TO authenticated USING (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "waitlist_admin_update" ON public.waitlist FOR UPDATE TO authenticated USING (public.has_role((select auth.uid()), 'admin')) WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "waitlist_admin_delete" ON public.waitlist FOR DELETE TO authenticated USING (public.has_role((select auth.uid()), 'admin'));

-- ============ PLANS ============
DROP POLICY IF EXISTS "Anyone reads active plans" ON public.plans;
DROP POLICY IF EXISTS "Admins manage plans" ON public.plans;
CREATE POLICY "plans_select" ON public.plans FOR SELECT TO anon, authenticated
  USING (active = true OR public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "plans_admin_insert" ON public.plans FOR INSERT TO authenticated WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "plans_admin_update" ON public.plans FOR UPDATE TO authenticated USING (public.has_role((select auth.uid()), 'admin')) WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "plans_admin_delete" ON public.plans FOR DELETE TO authenticated USING (public.has_role((select auth.uid()), 'admin'));

-- ============ SUBSCRIPTIONS ============
DROP POLICY IF EXISTS "Users read own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins read all subscriptions" ON public.subscriptions;
CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR public.has_role((select auth.uid()), 'admin'));

-- ============ API_KEYS ============
DROP POLICY IF EXISTS "Users read own keys" ON public.api_keys;
CREATE POLICY "api_keys_select" ON public.api_keys FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============ USAGE_EVENTS ============
DROP POLICY IF EXISTS "Users read own usage" ON public.usage_events;
DROP POLICY IF EXISTS "Admins read all usage" ON public.usage_events;
CREATE POLICY "usage_events_select" ON public.usage_events FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR public.has_role((select auth.uid()), 'admin'));

-- ============ PRODUCT_CACHE ============
DROP POLICY IF EXISTS "Admins read cache" ON public.product_cache;
DROP POLICY IF EXISTS "Admins manage cache" ON public.product_cache;
CREATE POLICY "product_cache_admin_all" ON public.product_cache FOR ALL TO authenticated
  USING (public.has_role((select auth.uid()), 'admin')) WITH CHECK (public.has_role((select auth.uid()), 'admin'));

-- ============ RESOLUTIONS ============
DROP POLICY IF EXISTS "Users read own resolutions" ON public.resolutions;
CREATE POLICY "resolutions_select" ON public.resolutions FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============ WEBHOOKS ============
DROP POLICY IF EXISTS "Users manage own webhooks" ON public.webhooks;
CREATE POLICY "webhooks_manage_own" ON public.webhooks FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- ============ WEBHOOK_DELIVERIES ============
DROP POLICY IF EXISTS "Users read own webhook deliveries" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "Admins read all webhook deliveries" ON public.webhook_deliveries;
CREATE POLICY "webhook_deliveries_select" ON public.webhook_deliveries FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.webhooks w WHERE w.id = webhook_id AND w.user_id = (select auth.uid()))
    OR public.has_role((select auth.uid()), 'admin')
  );

-- ============ TAKEDOWN_REQUESTS ============
DROP POLICY IF EXISTS "Anyone can file takedown" ON public.takedown_requests;
DROP POLICY IF EXISTS "Admins manage takedowns" ON public.takedown_requests;
CREATE POLICY "takedown_insert_public" ON public.takedown_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "takedown_admin_select" ON public.takedown_requests FOR SELECT TO authenticated USING (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "takedown_admin_update" ON public.takedown_requests FOR UPDATE TO authenticated USING (public.has_role((select auth.uid()), 'admin')) WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "takedown_admin_delete" ON public.takedown_requests FOR DELETE TO authenticated USING (public.has_role((select auth.uid()), 'admin'));

-- ============ INVOICES ============
DROP POLICY IF EXISTS "Users read own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins read all invoices" ON public.invoices;
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR public.has_role((select auth.uid()), 'admin'));

-- ============ AUDIT_LOG ============
DROP POLICY IF EXISTS "Admins read audit log" ON public.audit_log;
CREATE POLICY "audit_log_admin_select" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- ============ FK COVERING INDEXES ============
CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_product_cache_created_by ON public.product_cache(created_by);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_usage_api_key ON public.usage_events(api_key_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_approved_by ON public.waitlist(approved_by);
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON public.webhooks(user_id);
