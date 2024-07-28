import { twMerge } from 'tailwind-merge';
import { type ClassValue, clsx } from 'clsx';

/**
 * Returns the combined class names from the given inputs.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Creates a method chain by accepting multiple callback functions and returning a new function
 * that will execute all the callbacks in the specified order when invoked.
 */
export function chain<T extends unknown[]>(...callbacks: ((...args: T) => void)[]): (...args: T) => void {
  return (...args: T) => {
    for (const callback of callbacks) {
      callback(...args);
    }
  };
}
