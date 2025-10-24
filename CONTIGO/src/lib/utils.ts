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
