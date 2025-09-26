declare namespace jest {
  interface Matchers<R> {
    toHaveClassName: (expected: string | string[]) => R;
  }
}
