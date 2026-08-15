export type Role = 
  | 'super_admin' 
  | 'team_manager' 
  | 'form_editor' 
  | 'submission_viewer' 
  | 'content_editor';

// ============================================================================
// 1. UI DEFINITIONS: Single source of truth for Role UI Labels & Descriptions
// ============================================================================
export const ROLE_DEFINITIONS: { id: Role; label: string; description: string }[] = [
  { 
    id: 'super_admin', 
    label: 'Super Admin',
    description: 'Full system oversight, manager management, and platform administration.'
  },
  { 
    id: 'team_manager', 
    label: 'Team Manager',
    description: 'Manage team members, update role assignments, and review audit logs.'
  },
  { 
    id: 'form_editor', 
    label: 'Form Editor',
    description: 'Create, edit, and publish dynamic forms.'
  },
  { 
    id: 'content_editor', 
    label: 'Content Editor',
    description: 'Create and update events, resources, and site pages.'
  },
  { 
    id: 'submission_viewer', 
    label: 'Submission Viewer',
    description: 'View and export form submission data.'
  }
];

// ============================================================================
// 2. HIERARCHY RULES: Single source of truth for Role Assignment Authority
// Defines which roles are allowed to assign/revoke a specific target role.
// ============================================================================
export const ROLE_ASSIGNMENT_AUTHORITY: Record<Role, Role[]> = {
  // Empty array = No one can assign this via UI (must be done directly in DB)
  super_admin: [], 
  // Only Super Admins can promote someone to Team Manager
  team_manager: ['super_admin'], 
  // Both Super Admins and Team Managers can assign standard operational roles
  form_editor: ['super_admin', 'team_manager'],
  content_editor: ['super_admin', 'team_manager'],
  submission_viewer: ['super_admin', 'team_manager']
};

export type SystemAction = 
  | 'forms:create' | 'forms:edit' | 'forms:delete' | 'forms:update_status'
  | 'submissions:view_real' | 'submissions:view_test' | 'submissions:export_real' 
  | 'submissions:export_test' | 'submissions:manage' 
  | 'content:create' | 'content:edit' | 'content:delete'
  | 'team:view' | 'team:manage_workers' | 'team:manage_managers'
  | 'system:super_admin';

export const ROLE_PERMISSIONS: Partial<Record<Role, SystemAction[]>> = {
  team_manager: ['team:view', 'team:manage_workers'],
  form_editor: [
    'forms:create', 'forms:edit', 'forms:delete', 'forms:update_status',
    'submissions:view_test', 'submissions:export_test'
  ],
  submission_viewer: [ 
    'submissions:view_real', 'submissions:view_test', 
    'submissions:export_real', 'submissions:export_test', 'submissions:manage'
  ],
  content_editor: ['content:create', 'content:edit', 'content:delete']
};

export function hasPermission(userRoles: string[] | undefined | null, action: SystemAction): boolean {
  if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) return false;
  if (userRoles.includes('super_admin')) return true;
  
  for (const roleStr of userRoles) {
    const role = roleStr as Role;
    const permissions = ROLE_PERMISSIONS[role];
    if (permissions && permissions.includes(action)) return true;
  }
  return false;
}

/**
 * Validates if a user's roles give them authority to assign/revoke a specific target role.
 */
export function canAssignRole(assignerRoles: string[], targetRole: Role): boolean {
  const authorizedRoles = ROLE_ASSIGNMENT_AUTHORITY[targetRole];
  return assignerRoles.some(role => authorizedRoles.includes(role as Role));
}