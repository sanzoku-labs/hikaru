/**
 * Formatting utility functions
 * Consolidates all formatting logic (dates, numbers, file sizes, etc.)
 */

/**
 * Format a date string to a human-readable format
 *
 * @example
 * formatDate('2025-01-15T10:30:00Z') // 'Jan 15, 2025'
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to include time
 *
 * @example
 * formatDateTime('2025-01-15T10:30:00Z') // 'Jan 15, 2025 at 10:30 AM'
 */
export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  const datePart = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart} at ${timePart}`;
}

/**
 * Format a relative time (e.g., "2 days ago")
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) // '2 days ago'
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  if (diffDay < 30) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;

  return formatDate(dateObj);
}

/**
 * Format file size in bytes to human-readable format
 *
 * @example
 * formatFileSize(1024) // '1.00 KB'
 * formatFileSize(1536) // '1.50 KB'
 * formatFileSize(1048576) // '1.00 MB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format a number with thousand separators
 *
 * @example
 * formatNumber(1000) // '1,000'
 * formatNumber(1234567) // '1,234,567'
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format a number as a percentage
 *
 * @example
 * formatPercentage(0.456) // '45.6%'
 * formatPercentage(0.456, 0) // '46%'
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format currency (USD)
 *
 * @example
 * formatCurrency(1234.56) // '$1,234.56'
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Truncate text with ellipsis
 *
 * @example
 * truncate('Hello World', 8) // 'Hello...'
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format a duration in milliseconds to human-readable format
 *
 * @example
 * formatDuration(65000) // '1m 5s'
 * formatDuration(3665000) // '1h 1m 5s'
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
