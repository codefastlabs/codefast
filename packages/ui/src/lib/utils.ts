import { twMerge } from 'tailwind-merge';
import { type ClassValue, clsx } from 'clsx';

/**
 * Returns the combined class names from the given inputs.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
