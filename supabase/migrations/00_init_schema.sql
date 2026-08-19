-- ==========================================
-- DAOJI PLATFORM - COMPLETE DATABASE SCHEMA
-- ==========================================

-- 1. Create Forms Table
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE,
    event_id TEXT NOT NULL,
    title TEXT NOT NULL,
    is_followup BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft',
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    applicant_token TEXT,
    applicant_seq_num INTEGER,
    response JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_test BOOLEAN DEFAULT false,
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Team Members Table (RBAC / Auth Profile)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    roles TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'invited',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Audit Logs Table (CDC Mutation Log)
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE & LOOKUPS
-- ==========================================

-- Forms indexes
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);

-- Submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_event_token 
ON submissions(event_id, applicant_token);

CREATE INDEX IF NOT EXISTS idx_submissions_form_date 
ON submissions(form_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_event_seq 
ON submissions(event_id, applicant_seq_num DESC);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_roles 
ON team_members USING GIN (roles);

CREATE INDEX IF NOT EXISTS idx_team_members_email 
ON team_members(email);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name 
ON audit_logs(table_name);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email 
ON audit_logs(actor_email);

CREATE INDEX IF NOT EXISTS idx_audit_logs_record_label 
ON audit_logs(record_label);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Forms Policies
CREATE POLICY "Allow authenticated CRUD on forms" 
ON forms FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- Submissions Policies
CREATE POLICY "Allow authenticated CRUD on submissions" 
ON submissions FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- Team Members Policies
CREATE POLICY "Allow authenticated CRUD on team_members" 
ON team_members FOR ALL TO authenticated 
USING (true) WITH CHECK (true);

-- Audit Logs Policies (Default-Deny for anon/authenticated, accessed via Admin Client)
-- No public/authenticated policies granted.

-- ==========================================
-- AUTOMATED APPLICANT SEQUENCE TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION set_applicant_seq_num()
RETURNS TRIGGER AS $$
DECLARE
    existing_seq INTEGER;
    next_seq INTEGER;
BEGIN
    SELECT applicant_seq_num INTO existing_seq
    FROM submissions
    WHERE event_id = NEW.event_id 
      AND applicant_token = NEW.applicant_token 
      AND applicant_seq_num IS NOT NULL
    LIMIT 1;

    IF existing_seq IS NOT NULL THEN
        NEW.applicant_seq_num := existing_seq;
    ELSE
        SELECT COALESCE(MAX(applicant_seq_num), 0) + 1 INTO next_seq
        FROM submissions
        WHERE event_id = NEW.event_id;

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

-- ==========================================
-- AUTOMATED CDC AUDIT LOG TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION process_audit_log_cdc()
RETURNS TRIGGER AS $$
DECLARE
    acting_user_id UUID;
    actor_user_name TEXT;
    actor_user_email TEXT;
    extracted_label TEXT;
    old_data JSONB := NULL;
    new_data JSONB := NULL;
BEGIN
    -- 1. Resolve current actor identity
    acting_user_id := auth.uid();

    IF acting_user_id IS NOT NULL THEN
        SELECT display_name, email 
        INTO actor_user_name, actor_user_email
        FROM team_members
        WHERE id = acting_user_id;

        IF actor_user_email IS NULL THEN
            SELECT email INTO actor_user_email
            FROM auth.users
            WHERE id = acting_user_id;
        END IF;
    END IF;

    IF actor_user_name IS NULL AND actor_user_email IS NOT NULL THEN
        actor_user_name := actor_user_email;
    ELSIF actor_user_name IS NULL THEN
        actor_user_name := 'system';
    END IF;

    -- 2. Capture deltas
    IF TG_OP = 'INSERT' THEN
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
    END IF;

    -- 3. Resolve human-readable entity descriptor
    IF TG_TABLE_NAME = 'forms' THEN
        IF TG_OP = 'DELETE' THEN
            extracted_label := COALESCE(OLD.title, OLD.slug, OLD.id::text);
        ELSE
            extracted_label := COALESCE(NEW.title, NEW.slug, NEW.id::text);
        END IF;
    ELSIF TG_TABLE_NAME = 'team_members' THEN
        IF TG_OP = 'DELETE' THEN
            extracted_label := COALESCE(
                CASE WHEN OLD.display_name IS NOT NULL AND OLD.email IS NOT NULL 
                     THEN OLD.display_name || ' (' || OLD.email || ')'
                     ELSE COALESCE(OLD.display_name, OLD.email)
                END, 
                OLD.id::text
            );
        ELSE
            extracted_label := COALESCE(
                CASE WHEN NEW.display_name IS NOT NULL AND NEW.email IS NOT NULL 
                     THEN NEW.display_name || ' (' || NEW.email || ')'
                     ELSE COALESCE(NEW.display_name, NEW.email)
                END, 
                NEW.id::text
            );
        END IF;
    ELSE
        extracted_label := COALESCE((CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END), 'unknown');
    END IF;

    -- 4. Record audit event
    INSERT INTO audit_logs (
        table_name,
        record_id,
        record_label,
        operation,
        old_values,
        new_values,
        actor_id,
        actor_email,
        actor_name,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END,
        extracted_label,
        TG_OP,
        old_data,
        new_data,
        acting_user_id,
        actor_user_email,
        actor_user_name,
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach CDC triggers to mutable configuration entities
DROP TRIGGER IF EXISTS trg_audit_forms ON forms;
CREATE TRIGGER trg_audit_forms
AFTER INSERT OR UPDATE OR DELETE ON forms
FOR EACH ROW EXECUTE FUNCTION process_audit_log_cdc();

DROP TRIGGER IF EXISTS trg_audit_team_members ON team_members;
CREATE TRIGGER trg_audit_team_members
AFTER INSERT OR UPDATE OR DELETE ON team_members
FOR EACH ROW EXECUTE FUNCTION process_audit_log_cdc();