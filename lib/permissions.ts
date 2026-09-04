export type Role = 
  | 'super_admin' 
  | 'team_manager' 
  | 'form_editor' 
  | 'submission_viewer' 
  | 'content_editor'
  | 'event_coordinator'
  | 'viewer';

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
    description: 'Create, edit, and publish dynamic forms and upload form assets.'
  },
  { 
    id: 'content_editor', 
    label: 'Content Editor',
    description: 'Create and manage articles, resources, media assets, and site taxonomy.'
  },
  { 
    id: 'event_coordinator', 
    label: 'Event Coordinator',
    description: 'Manage operational events, linked forms, registration statuses, and applicant submissions.'
  },
  { 
    id: 'submission_viewer', 
    label: 'Submission Viewer',
    description: 'View and export form submission data.'
  },
  { 
    id: 'viewer', 
    label: 'Viewer (Read-Only)',
    description: 'Inspect dashboard modules, published content, and test submissions in read-only mode.'
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
  event_coordinator: ['super_admin', 'team_manager'],
  submission_viewer: ['super_admin', 'team_manager'],
  viewer: ['super_admin', 'team_manager']
};

// ============================================================================
// 3. SYSTEM ACTIONS & PERMISSION MAPPINGS
// ============================================================================
export type SystemAction = 
  // Forms & Submissions
  | 'forms:view' | 'forms:view_schema' | 'forms:create' | 'forms:edit' | 'forms:delete' | 'forms:update_status'
  | 'submissions:view_real' | 'submissions:view_test' | 'submissions:export_real' 
  | 'submissions:export_test' | 'submissions:manage' 
  
  // Team & Administration
  | 'team:view' | 'team:manage_workers' | 'team:manage_managers'
  | 'logs:view'
  | 'system:super_admin'

  // Media Pool (Assets)
  | 'assets:view' | 'assets:upload' | 'assets:delete'

  // Taxonomy & Tags
  | 'tags:view' | 'tags:create' | 'tags:edit' | 'tags:delete'

  // Events Domain
  | 'events:view' | 'events:create' | 'events:edit' | 'events:delete' | 'events:publish'

  // Articles & Pages Domain
  | 'articles:view' | 'articles:create' | 'articles:edit' | 'articles:delete' | 'articles:publish'

  // Resources Domain
  | 'resources:view' | 'resources:create' | 'resources:edit' | 'resources:delete' | 'resources:publish';

export const ROLE_PERMISSIONS: Partial<Record<Role, SystemAction[]>> = {
  team_manager: [
    'team:view', 
    'team:manage_workers',
    'logs:view'
  ],
  form_editor: [
    'forms:view',
    'forms:view_schema',
    'forms:create', 
    'forms:edit', 
    'forms:delete', 
    'forms:update_status',
    'submissions:view_test', 
    'submissions:export_test',
    'assets:view', 
    'assets:upload',
    'tags:view'
  ],
  submission_viewer: [ 
    'forms:view',
    'submissions:view_real', 
    'submissions:view_test', 
    'submissions:export_real', 
    'submissions:export_test', 
    'submissions:manage'
  ],
  content_editor: [
    'assets:view', 
    'assets:upload', 
    'assets:delete',
    'tags:view',
    'tags:create',
    'tags:edit',
    'tags:delete',
    'events:view', 
    'events:create', 
    'events:edit', 
    'events:delete', 
    'events:publish',
    'articles:view', 
    'articles:create', 
    'articles:edit', 
    'articles:delete', 
    'articles:publish',
    'resources:view', 
    'resources:create', 
    'resources:edit', 
    'resources:delete', 
    'resources:publish'
  ],
  event_coordinator: [
    'forms:view',
    'forms:view_schema',
    'forms:create',
    'forms:edit',
    'submissions:view_real',
    'submissions:view_test',
    'submissions:export_real',
    'submissions:export_test',
    'assets:view',
    'assets:upload',
    'tags:view',
    'tags:create',
    'events:view',
    'events:create',
    'events:edit',
    'events:publish',
    'articles:view',
    'articles:create',
    'articles:edit'
  ],
  viewer: [
    'forms:view',
    'forms:view_schema',
    'submissions:view_test',
    'assets:view',
    'tags:view',
    'events:view',
    'articles:view',
    'resources:view'
  ]
}

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