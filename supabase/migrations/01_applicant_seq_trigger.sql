-- 1. Add the new column to your existing table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS applicant_seq_num INTEGER;

-- 2. Create the sequence generation function
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

-- 3. Bind the function to a Trigger on the submissions table
DROP TRIGGER IF EXISTS trigger_set_applicant_seq ON submissions;

CREATE TRIGGER trigger_set_applicant_seq
BEFORE INSERT ON submissions
FOR EACH ROW
EXECUTE FUNCTION set_applicant_seq_num();