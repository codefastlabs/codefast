import "vitest";

declare module "vitest" {
  interface Assertion<T = unknown> {
    toHaveClassName(expected: string | Array<string>): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveClassName(expected: string | Array<string>): void;
  }
}
