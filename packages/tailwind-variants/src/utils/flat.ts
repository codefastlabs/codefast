export function flat(arr: unknown[], target: unknown[]): void {
  for (const el of arr) {
    if (Array.isArray(el)) flat(el, target);
    else target.push(el);
  }
}

export function flatArray(arr: unknown[]): unknown[] {
  const flattened: unknown[] = [];

  flat(arr, flattened);

  return flattened;
}
