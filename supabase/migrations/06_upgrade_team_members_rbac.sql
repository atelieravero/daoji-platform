-- 6. AUTOMATED USER ACTIVATION TRIGGER
CREATE OR REPLACE FUNCTION activate_invited_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Handles transition from passwordless/empty to having a hashed password
    IF (OLD.encrypted_password IS NULL OR OLD.encrypted_password = '') 
       AND (NEW.encrypted_password IS NOT NULL AND NEW.encrypted_password <> '') THEN
        UPDATE public.team_members 
        SET status = 'active', updated_at = NOW()
        WHERE id = NEW.id AND status = 'invited';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_activate_invited_user ON auth.users;
CREATE TRIGGER trigger_activate_invited_user
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION activate_invited_user();