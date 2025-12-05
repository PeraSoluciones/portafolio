import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateAge = (birthDate: string) => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

export const formatedCurrentDate = (
  local: string = 'en-CA',
  timeZone: string = 'America/Guayaquil'
) => {
  return new Date().toLocaleDateString(local, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  });
};

export const formatedDate = (
  date: Date,
  local: string = 'en-CA',
  timeZone: string = 'America/Guayaquil'
) => {
  return date.toLocaleDateString(local, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  });
};

export const extractFirstParagraphText = (htmlContent: string): string => {
  if (typeof window === 'undefined' || !htmlContent) {
    return '';
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const firstParagraph = doc.querySelector('p');

    if (firstParagraph) {
      return firstParagraph.textContent || '';
    }

    // Fallback if no paragraph is found
    return doc.body.textContent?.substring(0, 150) || '';
  } catch (error) {
    console.error('Error parsing HTML content:', error);
    return '';
  }
};

/**
 * Get current date in a specific timezone, always returns YYYY-MM-DD format
 * This ensures consistent date handling regardless of server timezone
 * @param timezone - IANA timezone string (default: 'America/Guayaquil' for Ecuador)
 * @returns Date string in YYYY-MM-DD format
 */
export const getLocalDateInTimezone = (
  timezone: string = 'America/Guayaquil'
): string => {
  const now = new Date();

  // Use Intl.DateTimeFormat to get date parts in the specified timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  });

  // Format returns YYYY-MM-DD which is what we need
  return formatter.format(now);
};

/**
 * Format a date string for display to users
 * @param dateString - Date in YYYY-MM-DD format
 * @param locale - Locale for formatting (default: 'es-EC' for Ecuador Spanish)
 * @returns Formatted date string for display
 */
export const formatDateForDisplay = (
  dateString: string,
  locale: string = 'es-EC'
): string => {
  // Parse date as local date (not UTC) to avoid timezone shifts
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Convert a Date object to YYYY-MM-DD string format
 * This is safer than using toLocaleDateString for database storage
 * @param date - Date object to convert
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
