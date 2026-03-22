import { RetentionStatus } from '@/types';

/**
 * Calculate the retention status of a contract or document based on its expiry date.
 */
export function getRetentionStatus(expiryDate: string | null): RetentionStatus {
  if (!expiryDate) return 'permanent';

  const expiry = new Date(expiryDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expiry <= now) return 'expired';
  if (expiry <= thirtyDaysFromNow) return 'expiring';
  return 'safe';
}

/**
 * Get a human-readable label for a retention status.
 */
export function getRetentionLabel(status: RetentionStatus): string {
  switch (status) {
    case 'safe':
      return 'Active';
    case 'expiring':
      return 'Expiring soon';
    case 'expired':
      return 'Expired';
    case 'permanent':
      return 'No expiry';
  }
}

/**
 * Get the CSS class for a retention pill based on status.
 */
export function getRetentionClass(status: RetentionStatus): string {
  switch (status) {
    case 'safe':
      return 'retention-safe';
    case 'expiring':
      return 'retention-expiring';
    case 'expired':
      return 'retention-expired';
    case 'permanent':
      return 'retention-permanent';
  }
}

/**
 * Format an expiry date for display.
 */
export function formatExpiryDate(expiryDate: string | null): string {
  if (!expiryDate) return 'Permanent';

  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Expired ${Math.abs(diffDays)}d ago`;
  if (diffDays === 0) return 'Expires today';
  if (diffDays === 1) return 'Expires tomorrow';
  if (diffDays <= 30) return `Expires in ${diffDays}d`;

  return expiry.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
