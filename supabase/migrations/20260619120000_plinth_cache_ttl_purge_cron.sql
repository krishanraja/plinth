-- Reap expired and taken-down product_cache rows every 30 minutes.
-- Reads already filter on expires_at/takedown; this keeps the table small and
-- enforces takedowns promptly. pg_cron is installed on this project.
SELECT cron.schedule(
  'plinth-cache-purge',
  '*/30 * * * *',
  $$DELETE FROM public.product_cache WHERE expires_at < now() OR takedown = true$$
);
