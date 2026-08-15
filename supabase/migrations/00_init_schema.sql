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

-- ==========================================
-- INDEXES FOR PERFORMANCE & LOOKUPS
-- ==========================================

-- Optimizes: Slug lookups for static generation and edge caching
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);

-- Optimizes: Token verification and follow-up checks
CREATE INDEX IF NOT EXISTS idx_submissions_event_token 
ON submissions(event_id, applicant_token);

-- Optimizes: Admin submissions dashboard sorting
CREATE INDEX IF NOT EXISTS idx_submissions_form_date 
ON submissions(form_id, created_at DESC);

-- Optimizes: Sequence Trigger MAX() lookup
CREATE INDEX IF NOT EXISTS idx_submissions_event_seq 
ON submissions(event_id, applicant_seq_num DESC);

-- Optimizes: RBAC role array checks
CREATE INDEX IF NOT EXISTS idx_team_members_roles 
ON team_members USING GIN (roles);

-- Optimizes: User lookups by email
CREATE INDEX IF NOT EXISTS idx_team_members_email 
ON team_members(email);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Team Members Policies
CREATE POLICY "Users can read own profile" 
ON team_members FOR SELECT 
USING (auth.uid() = id);

-- ==========================================
-- AUTOMATED APPLICANT SEQUENCE TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION set_applicant_seq_num()
RETURNS TRIGGER AS $$
DECLARE
    existing_seq INTEGER;
    next_seq INTEGER;
BEGIN
    -- Check if applicant_token already has a sequence number for this event
    SELECT applicant_seq_num INTO existing_seq
    FROM submissions
    WHERE event_id = NEW.event_id 
      AND applicant_token = NEW.applicant_token 
      AND applicant_seq_num IS NOT NULL
    LIMIT 1;

    -- If sequence exists, inherit existing number (follow-up form)
    IF existing_seq IS NOT NULL THEN
        NEW.applicant_seq_num := existing_seq;
    ELSE
        -- Brand new applicant: MAX(applicant_seq_num) + 1
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