import { createClient } from '@/lib/supabase/server';

export type Permission =
  | 'upload_contracts'
  | 'upload_documents'
  | 'view_all_contracts'
  | 'run_analysis'
  | 'delete_records';

export interface UserMembership {
  userId: string;
  orgId: string;
  orgName: string;
  joinCode: string;
  role: 'admin' | 'staff';
  permissions: Record<Permission, boolean>;
}

export const DEFAULT_STAFF_PERMISSIONS: Record<Permission, boolean> = {
  upload_contracts: true,
  upload_documents: true,
  view_all_contracts: false,
  run_analysis: true,
  delete_records: false,
};

/**
 * Returns the current authenticated user's org membership, or null if
 * they are not logged in or have not joined/created an organization.
 */
export async function getUserMembership(): Promise<UserMembership | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('*, organizations(id, name, join_code)')
    .eq('user_id', user.id)
    .single();

  if (!membership) return null;

  const org = membership.organizations as {
    id: string;
    name: string;
    join_code: string;
  } | null;

  return {
    userId: user.id,
    orgId: membership.org_id,
    orgName: org?.name ?? 'Unknown Organization',
    joinCode: org?.join_code ?? '',
    role: membership.role as 'admin' | 'staff',
    permissions: (membership.permissions as Record<Permission, boolean>) ?? DEFAULT_STAFF_PERMISSIONS,
  };
}

/**
 * Returns true if the user has the given permission.
 * Admins always return true regardless of the permissions object.
 */
export function hasPermission(
  membership: UserMembership,
  permission: Permission
): boolean {
  if (membership.role === 'admin') return true;
  return membership.permissions[permission] ?? false;
}
