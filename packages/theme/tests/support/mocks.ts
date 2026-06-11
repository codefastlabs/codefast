/* -----------------------------------------------------------------------------
 * Shared test mock factories — import in test files instead of creating inline
 * -------------------------------------------------------------------------- */

export type MockMediaQueryList = {
  matches: boolean;
  media: string;
  onchange: null;
  addEventListener: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
};

export function createMockMediaQueryList(matches: boolean, media: string): MockMediaQueryList {
  return {
    matches,
    media,
    onchange: null,
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  };
}

/**
 * Override window.matchMedia for a test.
 * Default implementation returns light-mode (matches: false) for every query.
 */
export function mockMatchMedia(
  implementation: (query: string) => MockMediaQueryList = (query) => createMockMediaQueryList(false, query),
): void {
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockImplementation(implementation),
    writable: true,
  });
}
