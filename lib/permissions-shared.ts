/**
 * Shared types and constants for the permissions system.
 * This file is safe to import in BOTH client and server components.
 *
 * Server-only helpers (getUserMembership, hasPermission) live in lib/permissions.ts
 * and must only be imported from API routes and Server Components.
 */

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
