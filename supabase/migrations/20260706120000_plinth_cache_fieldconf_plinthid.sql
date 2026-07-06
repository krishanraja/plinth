-- PLAN P1.8: cached hits must return real field_confidence (the audit found cached
-- reads dropped it, undercutting the instant-repeat-read magic moment). Plus the
-- calibration_version so a cached confidence stays auditable across recalibrations.
ALTER TABLE public.product_cache
  ADD COLUMN IF NOT EXISTS field_confidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS calibration_version TEXT;

-- MOAT SEED (opaque plinth_id): a minted, never-derivable identity per resolved
-- product, under which longitudinal observations accumulate. Stored here so a repeat
-- read returns the SAME id, and customers can store it as a foreign key in their own
-- schema (the switching cost no competitor can backdate). Never derived from URL/GTIN.
ALTER TABLE public.product_cache
  ADD COLUMN IF NOT EXISTS plinth_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS product_cache_plinth_id_idx
  ON public.product_cache (plinth_id) WHERE plinth_id IS NOT NULL;

COMMENT ON COLUMN public.product_cache.plinth_id IS 'Opaque minted product identity (pl_...), stable across re-reads, never derived from URL or GTIN. The moat anchor for longitudinal history.';
