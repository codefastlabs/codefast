import type { ClassValue } from 'clsx';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Returns the combined class names from the given inputs.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
