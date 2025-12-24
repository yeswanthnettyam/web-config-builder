// Utility functions

import { format, parseISO } from 'date-fns';

/**
 * Format date string to readable format
 */
export const formatDate = (dateString: string, formatStr = 'MMM dd, yyyy'): string => {
  try {
    return format(parseISO(dateString), formatStr);
  } catch {
    return dateString;
  }
};

/**
 * Format datetime string to readable format
 */
export const formatDateTime = (
  dateString: string,
  formatStr = 'MMM dd, yyyy HH:mm'
): string => {
  try {
    return format(parseISO(dateString), formatStr);
  } catch {
    return dateString;
  }
};

/**
 * Validate snake_case field ID
 */
export const isValidFieldId = (fieldId: string): boolean => {
  return /^[a-z][a-z0-9_]*$/.test(fieldId);
};

/**
 * Convert string to snake_case
 */
export const toSnakeCase = (str: string): string => {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join('_');
};

/**
 * Validate regex pattern
 */
export const isValidRegex = (pattern: string): boolean => {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if user has required role
 */
export const hasRole = (userRole: string, allowedRoles: string[]): boolean => {
  return allowedRoles.includes(userRole);
};

/**
 * Check if user can edit (not VIEWER)
 */
export const canEdit = (userRole: string): boolean => {
  return userRole === 'ADMIN' || userRole === 'CONFIG_EDITOR';
};

/**
 * Check if user is admin
 */
export const isAdmin = (userRole: string): boolean => {
  return userRole === 'ADMIN';
};

/**
 * Generate unique ID
 */
export const generateId = (prefix = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Download JSON file
 */
export const downloadJson = (data: unknown, filename: string): void => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parse uploaded JSON file
 */
export const parseJsonFile = (file: File): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        resolve(json);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Get status color
 */
export const getStatusColor = (
  status: string
): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'DRAFT':
      return 'warning';
    case 'DEPRECATED':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get role color
 */
export const getRoleColor = (
  role: string
): 'primary' | 'secondary' | 'default' => {
  switch (role) {
    case 'ADMIN':
      return 'primary';
    case 'CONFIG_EDITOR':
      return 'secondary';
    default:
      return 'default';
  }
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Get error message from error object
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
};

/**
 * Calculate contrast ratio for WCAG compliance
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = parseInt(color.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const [rs, gs, bs] = [r, g, b].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
};

