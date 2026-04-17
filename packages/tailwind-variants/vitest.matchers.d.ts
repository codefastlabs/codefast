import "vitest";

declare module "vitest" {
  interface Assertion<T = unknown> {
    toHaveClassName(expected: string | string[]): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveClassName(expected: string | string[]): void;
  }
}
