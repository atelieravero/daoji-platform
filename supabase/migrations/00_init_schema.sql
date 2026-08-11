-- ==========================================
-- DAOJI PLATFORM - INITIAL DATABASE SCHEMA
-- ==========================================

-- 1. Create Forms Table
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 3. Create Indexes for Performance
-- Optimizes: Token verification and Follow-up checks (Instant lookups)
CREATE INDEX IF NOT EXISTS idx_submissions_event_token 
ON submissions(event_id, applicant_token);

-- Optimizes: Admin Dashboard loading (Prevents memory sorting)
CREATE INDEX IF NOT EXISTS idx_submissions_form_date 
ON submissions(form_id, created_at DESC);

-- Optimizes: The Sequence Trigger (Instant MAX() calculation to prevent lock-ups)
CREATE INDEX IF NOT EXISTS idx_submissions_event_seq 
ON submissions(event_id, applicant_seq_num DESC);


-- ==========================================
-- AUTOMATED APPLICANT SEQUENCE TRIGGER
-- ==========================================

-- 4. Create the sequence generation function
CREATE OR REPLACE FUNCTION set_applicant_seq_num()
RETURNS TRIGGER AS $$
DECLARE
    existing_seq INTEGER;
    next_seq INTEGER;
BEGIN
    -- STEP A: Check if this applicant_token already has a sequence number for this specific event
    SELECT applicant_seq_num INTO existing_seq
    FROM submissions
    WHERE event_id = NEW.event_id 
      AND applicant_token = NEW.applicant_token 
      AND applicant_seq_num IS NOT NULL
    LIMIT 1;

    -- If a sequence number exists, this is a follow-up form. Reuse their human-readable ID.
    IF existing_seq IS NOT NULL THEN
        NEW.applicant_seq_num := existing_seq;
    ELSE
        -- STEP B: This is a brand new applicant. 
        -- Find the highest existing sequence number for this event and add 1.
        -- COALESCE ensures that if this is the very first applicant (NULL), it defaults to 0 + 1 = 1.
        SELECT COALESCE(MAX(applicant_seq_num), 0) + 1 INTO next_seq
        FROM submissions
        WHERE event_id = NEW.event_id;

        NEW.applicant_seq_num := next_seq;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Bind the function to a Trigger on the submissions table
DROP TRIGGER IF EXISTS trigger_set_applicant_seq ON submissions;

CREATE TRIGGER trigger_set_applicant_seq
BEFORE INSERT ON submissions
FOR EACH ROW
EXECUTE FUNCTION set_applicant_seq_num();