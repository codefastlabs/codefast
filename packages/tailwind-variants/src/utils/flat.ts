import clsx from 'clsx';

export function flat(arr: unknown[], target: unknown[]): void {
  for (const el of arr) {
    if (Array.isArray(el)) flat(el, target);
    else target.push(el);
  }
}

export function flatArray(arr: unknown[]): unknown[] {
  // Use clsx to flatten arrays efficiently
  const flattened = clsx(arr);
  
  if (!flattened) return [];
  
  // Split the result back into an array for consistency with existing logic
  return flattened.split(' ').filter(Boolean);
}
