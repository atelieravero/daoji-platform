-- ==========================================
-- TICKET 11: ADD FORM SLUGS FOR EDGE CACHING
-- ==========================================

-- 1. Add the slug column (UNIQUE ensures no two forms share a URL)
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Create an index to make slug-based lookups lightning fast
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);