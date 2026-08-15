-- ==========================================
-- 04_upgrade_team_members_rbac.sql
-- ==========================================

-- 1. ADD GIN INDEX FOR ROLES
-- (Ensures lightning-fast array lookups if it wasn't added during the array conversion)
CREATE INDEX IF NOT EXISTS idx_team_members_roles ON public.team_members USING GIN (roles);

-- 2. ADD RLS READ POLICY
-- Allows a user to fetch their own profile (and ONLY their own profile) from the client side
CREATE POLICY "Users can view their own team profile" 
    ON public.team_members 
    FOR SELECT 
    USING (auth.uid() = id);

-- 3. ADD TIMESTAMP TRIGGER
-- Automatically updates the updated_at column on any row change
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_team_members_updated_at ON public.team_members;
CREATE TRIGGER trigger_update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION update_team_members_updated_at();

-- 4. ADD AUTOMATED USER ACTIVATION TRIGGER
-- Listens to Supabase Auth to flip 'invited' users to 'active' upon initial password setup
CREATE OR REPLACE FUNCTION activate_invited_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user is transitioning from passwordless to having a password
    IF OLD.encrypted_password IS NULL AND NEW.encrypted_password IS NOT NULL THEN
        UPDATE public.team_members 
        SET status = 'active', updated_at = NOW()
        WHERE id = NEW.id AND status = 'invited';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to the hidden auth.users table
DROP TRIGGER IF EXISTS trigger_activate_invited_user ON auth.users;
CREATE TRIGGER trigger_activate_invited_user
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION activate_invited_user();