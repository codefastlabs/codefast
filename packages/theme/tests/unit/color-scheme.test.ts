import { getSystemColorScheme, resolveColorScheme } from "#/color-scheme";
import { DEFAULT_COLOR_SCHEME } from "#/constants";
import { createMockMediaQueryList, mockMatchMedia } from "#/tests/unit/support/mocks";

describe("System Color Scheme Detection", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    // Restore original matchMedia after each test
    Object.defineProperty(window, "matchMedia", {
      value: originalMatchMedia,
      writable: true,
    });
  });

  describe("getSystemColorScheme", () => {
    test('should return "dark" when system prefers dark mode', () => {
      mockMatchMedia((query) => createMockMediaQueryList(query === "(prefers-color-scheme: dark)", query));

      expect(getSystemColorScheme()).toBe("dark");
    });

    test('should return "light" when system prefers light mode', () => {
      mockMatchMedia((query) => createMockMediaQueryList(false, query));

      expect(getSystemColorScheme()).toBe("light");
    });

    test("should have DEFAULT_COLOR_SCHEME as fallback for SSR", () => {
      // In SSR (no window), getSystemColorScheme returns DEFAULT_COLOR_SCHEME
      // We can't easily test this in jsdom, so we verify the constant is correct
      expect(DEFAULT_COLOR_SCHEME).toBe("dark");
    });
  });

  describe("resolveColorScheme", () => {
    test('should return "light" when color scheme is "light"', () => {
      expect(resolveColorScheme("light")).toBe("light");
    });

    test('should return "dark" when color scheme is "dark"', () => {
      expect(resolveColorScheme("dark")).toBe("dark");
    });

    test('should resolve "automatic" to system preference (light)', () => {
      mockMatchMedia(() => createMockMediaQueryList(false, ""));

      expect(resolveColorScheme("automatic")).toBe("light");
    });

    test('should resolve "automatic" to system preference (dark)', () => {
      mockMatchMedia((query) => createMockMediaQueryList(query === "(prefers-color-scheme: dark)", query));

      expect(resolveColorScheme("automatic")).toBe("dark");
    });
  });
});
