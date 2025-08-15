import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the base URL for the application
 * Works for both local development and production
 */
export function getBaseUrl() {
  // In production, use NEXTAUTH_URL or NEXT_PUBLIC_SITE_URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  }
  
  // In development, use localhost:3000 (standard Next.js port)
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

/**
 * Get the full URL for a given path
 */
export function getFullUrl(path: string = '') {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

export function formatCurrency(
  amount: number,
  options: {
    currency?: string;
    locale?: string;
    noDecimals?: boolean;
  } = {}
) {
  const { currency = 'USD', locale = 'en-US', noDecimals = false } = options;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: noDecimals ? 0 : 2,
    maximumFractionDigits: noDecimals ? 0 : 2,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1) {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, locale: string = 'en-US') {
  return new Intl.NumberFormat(locale).format(value);
}
