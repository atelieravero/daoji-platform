-- ==========================================
-- TICKET 12: TEAM MEMBERS & RBAC TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS team_members (
    -- Links strictly to Supabase Auth
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    -- Roles: super_admin, team_manager, form_editor, form_data_viewer, content_editor
    -- Defaults to NULL (Zero Access) for strict security
    role TEXT,
    -- Statuses: invited, active, suspended
    status TEXT NOT NULL DEFAULT 'invited', 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning-fast middleware validation and Admin UI sorting
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- ==========================================
-- SECURITY: ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Enforces a "Default Deny" policy for all public/client-side requests.
-- Next.js Server Actions will bypass this using the Service Role Key.
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;