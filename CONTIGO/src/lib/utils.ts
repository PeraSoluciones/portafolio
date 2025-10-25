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
  local: string = 'es-EC',
  timeZone: string = 'America/Guayaquil'
) => {
  return new Date().toLocaleDateString(local, {
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
