-- ==============================================================================
-- DAOJI PLATFORM - COMPLETE CONSOLIDATED DATABASE SCHEMA
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS & UTILITY FUNCTIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1.1 Base62 Short ID Generator (nanoid)
CREATE OR REPLACE FUNCTION nanoid(
  size INT DEFAULT 8,
  alphabet TEXT DEFAULT '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
)
RETURNS TEXT AS $$
DECLARE
  id TEXT := '';
  i INT := 0;
  bytes BYTEA;
  alphabet_len INT := length(alphabet);
  mask INT := (2 << cast(floor(ln((alphabet_len - 1)::numeric) / ln(2.0)) as int)) - 1;
  step INT := cast(ceil(1.6 * mask * size / alphabet_len) as int);
BEGIN
  WHILE i < size LOOP
    bytes := gen_random_bytes(step);
    FOR j IN 0..step - 1 LOOP
      DECLARE
        byte_val INT := get_byte(bytes, j) & mask;
      BEGIN
        IF byte_val < alphabet_len THEN
          id := id || substr(alphabet, byte_val + 1, 1);
          i := i + 1;
          IF i = size THEN
            RETURN id;
          END IF;
        END IF;
      END;
    END LOOP;
  END LOOP;
  RETURN id;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ==============================================================================
-- 2. FOUNDATION & STORAGE TABLES (Assets, Taxonomy)
-- ==============================================================================

-- 2.1 Media Pool (Assets)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_url TEXT NOT NULL,
    s3_key TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    width INT,
    height INT,
    alt_text_zh TEXT,
    alt_text_en TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Taxonomy (Tags)
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id TEXT NOT NULL UNIQUE DEFAULT nanoid(8),
    slug TEXT,
    name_zh TEXT NOT NULL,
    name_en TEXT,
    is_pillar BOOLEAN NOT NULL DEFAULT FALSE,
    color TEXT NOT NULL DEFAULT '#4F46E5',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Polymorphic Tag Relations (Taggables)
CREATE TABLE IF NOT EXISTS taggables (
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    taggable_id UUID NOT NULL,
    taggable_type TEXT NOT NULL CHECK (taggable_type IN ('event', 'content_page', 'resource', 'asset')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tag_id, taggable_id, taggable_type)
);

-- ==============================================================================
-- 3. OPERATIONAL REGISTRIES (Venues, Organizers, Events)
-- ==============================================================================

-- 3.1 Venues Registry
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_zh TEXT NOT NULL,
    name_en TEXT,
    address_zh TEXT,
    address_en TEXT,
    google_maps_url TEXT,
    amap_url TEXT,
    transport_guide_zh TEXT,
    transport_guide_en TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Organizers Registry
CREATE TABLE IF NOT EXISTS organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_zh TEXT,
    url TEXT,
    description_zh TEXT,
    description_en TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Operational Events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id TEXT NOT NULL UNIQUE DEFAULT nanoid(8),
    code TEXT CHECK (code ~ '^[A-Z0-9]{1,8}$'),
    slug TEXT,
    organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
    title_zh TEXT NOT NULL,
    title_en TEXT,
    summary_zh TEXT,
    summary_en TEXT,
    body_zh TEXT NOT NULL DEFAULT '',
    body_en TEXT,
    languages TEXT[] DEFAULT '{cantonese}',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Hong_Kong',
    is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule JSONB,
    blackout_dates DATE[],
    is_in_person BOOLEAN NOT NULL DEFAULT TRUE,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    venue_override_zh TEXT,
    venue_override_en TEXT,
    is_livestream BOOLEAN NOT NULL DEFAULT FALSE,
    livestream_config JSONB,
    registration_mode TEXT NOT NULL DEFAULT 'internal_form' CHECK (registration_mode IN ('internal_form', 'external_url', 'not_required')),
    linked_form_id UUID,
    external_url TEXT,
    registration_status TEXT NOT NULL DEFAULT 'upcoming' CHECK (registration_status IN ('upcoming', 'open', 'closed')),
    cta_label_zh TEXT,
    cta_label_en TEXT,
    banner_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unlisted', 'archived')),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. FORMS & SUBMISSIONS
-- ==============================================================================

-- 4.1 Dynamic Forms
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    is_followup BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT forms_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

-- Circular FK connection for Events linked form
ALTER TABLE events 
  DROP CONSTRAINT IF EXISTS events_linked_form_id_fkey;

ALTER TABLE events 
  ADD CONSTRAINT events_linked_form_id_fkey 
  FOREIGN KEY (linked_form_id) REFERENCES forms(id) ON DELETE SET NULL;

-- 4.2 Form Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_code TEXT NOT NULL,
    applicant_token TEXT,
    applicant_seq_num INTEGER,
    response JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_test BOOLEAN DEFAULT FALSE,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. EDITORIAL CONTENT & KNOWLEDGE HUB
-- ==============================================================================

-- 5.1 Editorial Content Pages & Articles
CREATE TABLE IF NOT EXISTS content_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id TEXT NOT NULL UNIQUE DEFAULT nanoid(8),
    slug TEXT,
    type TEXT NOT NULL DEFAULT 'article' CHECK (type IN ('page', 'article')),
    title_zh TEXT NOT NULL,
    title_en TEXT,
    body_zh TEXT NOT NULL DEFAULT '',
    body_en TEXT,
    cover_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    is_in_feed BOOLEAN NOT NULL DEFAULT TRUE,
    is_pinned_in_feed BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.2 Multi-Event Articles Junction Table
CREATE TABLE IF NOT EXISTS event_articles (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES content_pages(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, article_id)
);

-- 5.3 Knowledge Hub Resources
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id TEXT NOT NULL UNIQUE DEFAULT nanoid(8),
    slug TEXT,
    source_type TEXT NOT NULL CHECK (source_type IN ('asset', 'youtube', 'article', 'external_link')),
    target_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    target_page_id UUID REFERENCES content_pages(id) ON DELETE SET NULL,
    external_url TEXT,
    title_zh TEXT NOT NULL,
    title_en TEXT,
    description_zh TEXT,
    description_en TEXT,
    author_speaker_zh TEXT,
    author_speaker_en TEXT,
    cover_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. TEAM MEMBERS & AUDIT LOGGING
-- ==============================================================================

-- 6.1 Team Members (RBAC)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    roles TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 System Audit Logs (CDC Ledger)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    record_label TEXT,
    operation TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    actor_id UUID,
    actor_email TEXT NOT NULL DEFAULT 'system',
    actor_name TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT audit_logs_operation_check 
      CHECK (UPPER(operation) IN ('INSERT', 'UPDATE', 'DELETE', 'CREATE', 'PUBLISH', 'ARCHIVE', 'UNLIST'))
);

-- ==============================================================================
-- 7. PERFORMANCE INDEXES
-- ==============================================================================

-- Assets
CREATE INDEX IF NOT EXISTS idx_assets_mime_type ON assets(mime_type);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);

-- Tags & Taggables
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_slug_unique ON tags(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tags_short_id ON tags(short_id);
CREATE INDEX IF NOT EXISTS idx_tags_is_pillar ON tags(is_pillar);
CREATE INDEX IF NOT EXISTS idx_taggables_lookup ON taggables(taggable_id, taggable_type);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_code ON events(code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug_unique ON events(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_short_id ON events(short_id);
CREATE INDEX IF NOT EXISTS idx_events_status_dates ON events(status, start_date ASC);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue_id);

-- Forms & Submissions
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_event_id ON forms(event_id);
CREATE INDEX IF NOT EXISTS idx_submissions_event_code_token ON submissions(event_code, applicant_token);
CREATE INDEX IF NOT EXISTS idx_submissions_event_code_seq ON submissions(event_code, applicant_seq_num DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_form_date ON submissions(form_id, created_at DESC);

-- Content Pages & Resources
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_pages_slug_unique ON content_pages(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_pages_short_id ON content_pages(short_id);
CREATE INDEX IF NOT EXISTS idx_content_pages_feed ON content_pages(status, is_in_feed, published_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_slug_unique ON resources(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_short_id ON resources(short_id);
CREATE INDEX IF NOT EXISTS idx_resources_status_featured ON resources(status, is_featured, created_at DESC);

-- Team & Audit Logs
CREATE INDEX IF NOT EXISTS idx_team_members_roles ON team_members USING GIN (roles);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_label ON audit_logs(record_label);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE taggables ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 8.1 Public Read Policies
CREATE POLICY "Public read for assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Public read for tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Public read for taggables" ON taggables FOR SELECT USING (true);
CREATE POLICY "Public read for venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read for organizers" ON organizers FOR SELECT USING (true);
CREATE POLICY "Public read for published/unlisted events" ON events FOR SELECT USING (status IN ('published', 'unlisted'));
CREATE POLICY "Public read for published content_pages" ON content_pages FOR SELECT USING (status = 'published');
CREATE POLICY "Public read for event_articles" ON event_articles FOR SELECT USING (true);
CREATE POLICY "Public read for published resources" ON resources FOR SELECT USING (status = 'published');
CREATE POLICY "Public read for forms" ON forms FOR SELECT USING (true);

-- 8.2 Authenticated Staff Full Access Policies
CREATE POLICY "Authenticated staff full access assets" ON assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated staff full access tags" ON tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated staff full access taggables" ON taggables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated staff full access venues" ON venues FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated staff full access organizers" ON organizers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated staff full access events" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated staff full access forms" ON forms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated staff full access submissions" ON submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated staff full access content_pages" ON content_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated staff full access event_articles" ON event_articles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated staff full access resources" ON resources FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated staff full access team_members" ON team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated staff full access audit_logs" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 9. APPLICANT SEQUENCE GENERATOR TRIGGER (Event-Code Partitioned)
-- ==============================================================================

CREATE OR REPLACE FUNCTION set_applicant_seq_num()
RETURNS TRIGGER AS $$
DECLARE
    existing_seq INTEGER;
    next_seq INTEGER;
BEGIN
    -- 1. Retain sequence number if returning applicant within same event_code cohort
    SELECT applicant_seq_num INTO existing_seq
    FROM public.submissions
    WHERE event_code = NEW.event_code 
      AND applicant_token = NEW.applicant_token 
      AND applicant_seq_num IS NOT NULL
    LIMIT 1;

    IF existing_seq IS NOT NULL THEN
        NEW.applicant_seq_num := existing_seq;
    ELSE
        -- 2. Increment sequential counter scoped to this specific event_code
        SELECT COALESCE(MAX(applicant_seq_num), 0) + 1 INTO next_seq
        FROM public.submissions
        WHERE event_code = NEW.event_code;

        NEW.applicant_seq_num := next_seq;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_applicant_seq ON submissions;
CREATE TRIGGER trigger_set_applicant_seq
BEFORE INSERT ON submissions
FOR EACH ROW
EXECUTE FUNCTION set_applicant_seq_num();

-- ==============================================================================
-- 10. UNIFIED CDC AUDIT LOGGING ENGINE
-- ==============================================================================

CREATE OR REPLACE FUNCTION log_cdc_mutation()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_actor_name TEXT;
    v_actor_email TEXT;
    v_record_id TEXT;
    v_record_label TEXT;
    v_old_values JSONB := NULL;
    v_new_values JSONB := NULL;
BEGIN
    -- 1. Resolve actor profile
    IF v_actor_id IS NOT NULL THEN
        SELECT display_name, email INTO v_actor_name, v_actor_email
        FROM team_members
        WHERE id = v_actor_id
        LIMIT 1;

        IF v_actor_email IS NULL THEN
            SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id LIMIT 1;
        END IF;
    END IF;

    -- 2. Extract values and human-readable descriptor
    IF TG_OP = 'DELETE' THEN
        v_record_id := OLD.id::TEXT;
        v_old_values := to_jsonb(OLD);
        v_record_label := COALESCE(
            v_old_values->>'title_zh',
            v_old_values->>'title',
            v_old_values->>'name_zh',
            v_old_values->>'file_name',
            v_old_values->>'name_en',
            v_old_values->>'name',
            v_old_values->>'display_name',
            v_old_values->>'slug',
            v_old_values->>'email',
            v_record_id
        );
    ELSE
        v_record_id := NEW.id::TEXT;
        v_new_values := to_jsonb(NEW);
        IF TG_OP = 'UPDATE' THEN
            v_old_values := to_jsonb(OLD);
        END IF;
        v_record_label := COALESCE(
            v_new_values->>'title_zh',
            v_new_values->>'title',
            v_new_values->>'name_zh',
            v_new_values->>'file_name',
            v_new_values->>'name_en',
            v_new_values->>'name',
            v_new_values->>'display_name',
            v_new_values->>'slug',
            v_new_values->>'email',
            v_record_id
        );
    END IF;

    -- 3. Write immutable audit log
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO audit_logs (
            actor_id,
            actor_name,
            actor_email,
            table_name,
            operation,
            record_id,
            record_label,
            old_values,
            new_values,
            created_at
        ) VALUES (
            v_actor_id,
            COALESCE(v_actor_name, 'System / Anonymous'),
            COALESCE(v_actor_email, 'system@internal'),
            TG_TABLE_NAME,
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'CREATE'
                ELSE TG_OP
            END,
            v_record_id,
            v_record_label,
            v_old_values,
            v_new_values,
            NOW()
        );
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach CDC triggers
DROP TRIGGER IF EXISTS audit_forms_trigger ON forms;
CREATE TRIGGER audit_forms_trigger
AFTER INSERT OR UPDATE OR DELETE ON forms
FOR EACH ROW EXECUTE FUNCTION log_cdc_mutation();

DROP TRIGGER IF EXISTS audit_team_members_trigger ON team_members;
CREATE TRIGGER audit_team_members_trigger
AFTER INSERT OR UPDATE OR DELETE ON team_members
FOR EACH ROW EXECUTE FUNCTION log_cdc_mutation();

DROP TRIGGER IF EXISTS audit_assets_trigger ON assets;
CREATE TRIGGER audit_assets_trigger
AFTER INSERT OR UPDATE OR DELETE ON assets
FOR EACH ROW EXECUTE FUNCTION log_cdc_mutation();

DROP TRIGGER IF EXISTS audit_tags_trigger ON tags;
CREATE TRIGGER audit_tags_trigger
AFTER INSERT OR UPDATE OR DELETE ON tags
FOR EACH ROW EXECUTE FUNCTION log_cdc_mutation();

DROP TRIGGER IF EXISTS audit_events_trigger ON events;
CREATE TRIGGER audit_events_trigger
AFTER INSERT OR UPDATE OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION log_cdc_mutation();

DROP TRIGGER IF EXISTS audit_venues_trigger ON venues;
CREATE TRIGGER audit_venues_trigger
AFTER INSERT OR UPDATE OR DELETE ON venues
FOR EACH ROW EXECUTE FUNCTION log_cdc_mutation();

DROP TRIGGER IF EXISTS audit_organizers_trigger ON organizers;
CREATE TRIGGER audit_organizers_trigger
AFTER INSERT OR UPDATE OR DELETE ON organizers
FOR EACH ROW EXECUTE FUNCTION log_cdc_mutation();

DROP TRIGGER IF EXISTS audit_content_pages_trigger ON content_pages;
CREATE TRIGGER audit_content_pages_trigger
AFTER INSERT OR UPDATE OR DELETE ON content_pages
FOR EACH ROW EXECUTE FUNCTION log_cdc_mutation();

DROP TRIGGER IF EXISTS audit_resources_trigger ON resources;
CREATE TRIGGER audit_resources_trigger
AFTER INSERT OR UPDATE OR DELETE ON resources
FOR EACH ROW EXECUTE FUNCTION log_cdc_mutation();