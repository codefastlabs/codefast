declare global {
  namespace jest {
    interface Matchers<R> {
      toBeFriday: () => R;
      toBeMonday: () => R;
      toBeSaturday: () => R;
      toBeSunday: () => R;
      toBeThursday: () => R;
      toBeTuesday: () => R;
      toBeWednesday: () => R;
      toHaveDate: (expected: number) => R;
    }
  }
}

export {};
