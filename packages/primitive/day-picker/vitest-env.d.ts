/// <reference types="vitest/globals" />

import 'vitest';

interface CustomMatchers<R = unknown> {
  toBeFriday: () => R;
  toBeMonday: () => R;
  toBeSaturday: () => R;
  toBeSunday: () => R;
  toBeThursday: () => R;
  toBeTuesday: () => R;
  toBeWednesday: () => R;
  toHaveDate: (expected: number) => R;
}

declare module 'vitest' {
  interface Assertion<T> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
