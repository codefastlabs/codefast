import type { ClassValue } from 'clsx';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using `clsx` and merges them using `tailwind-merge`.
 * This ensures optimized class name handling for conditional and Tailwind-based classes.
 *
 * @param inputs - List of class names or conditional class name objects.
 * @returns A single optimized string of class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
