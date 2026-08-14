// lib/permissions.ts

export type Role = 
  | 'super_admin' 
  | 'team_manager' 
  | 'form_editor' 
  | 'submission_viewer' 
  | 'content_editor';

export type SystemAction = 
  // Form Builder
  | 'forms:create'
  | 'forms:edit'
  | 'forms:delete'
  | 'forms:update_status'

  // Applicant Submissions (Strict Test vs Real Split)
  | 'submissions:view_real'
  | 'submissions:view_test'
  | 'submissions:export_real'
  | 'submissions:export_test'
  | 'submissions:manage' 
  
  // Content & Web Assets
  | 'content:create'
  | 'content:edit'
  | 'content:delete'
  
  // Team & HR Access Split
  | 'team:view'
  | 'team:manage_workers'   // Allowed for team_manager
  | 'team:manage_managers'  // Strictly super_admin only
  
  // Root Access
  | 'system:super_admin';

/**
 * THE MASTER MATRIX
 * Maps roles to their allowed actions. 
 * Note: 'super_admin' is omitted here because it utilizes a wildcard bypass.
 */
export const ROLE_PERMISSIONS: Partial<Record<Role, SystemAction[]>> = {
  team_manager: [
    'team:view', 'team:manage_workers'
  ],
  form_editor: [
    'forms:create', 'forms:edit', 'forms:delete', 'forms:update_status',
    'submissions:view_test', 'submissions:export_test'
  ],
  submission_viewer: [ 
    'submissions:view_real', 'submissions:view_test', 
    'submissions:export_real', 'submissions:export_test',
    'submissions:manage'
  ],
  content_editor: [
    'content:create', 'content:edit', 'content:delete'
  ]
};

/**
 * Validates if the provided user roles grant the requested action.
 * Accepts `string[]` to cleanly handle raw Supabase database arrays.
 */
export function hasPermission(userRoles: string[] | undefined | null, action: SystemAction): boolean {
  // Fail secure: If user has no roles or invalid data, deny immediately
  if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) return false;
  
  // WILDCARD O(1) BYPASS: Super Admin automatically passes all checks
  if (userRoles.includes('super_admin')) return true;
  
  // Iterate through the user's assigned roles
  for (const roleStr of userRoles) {
    const role = roleStr as Role;
    const permissions = ROLE_PERMISSIONS[role];
    
    // If the role exists in the matrix and contains the action, unlock the door
    if (permissions && permissions.includes(action)) return true;
  }

  // If loop finishes without finding a match, access is denied
  return false;
}