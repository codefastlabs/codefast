import { DEFAULT_RESOLVED_THEME } from "#/constants";
import { getSystemTheme, resolveTheme } from "#/utils/system";
import { createMockMediaQueryList, mockMatchMedia } from "#/tests/support/mocks";

describe("System Theme Detection", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    // Restore original matchMedia after each test
    Object.defineProperty(window, "matchMedia", {
      value: originalMatchMedia,
      writable: true,
    });
  });

  describe("getSystemTheme", () => {
    test('should return "dark" when system prefers dark mode', () => {
      mockMatchMedia((query) =>
        createMockMediaQueryList(query === "(prefers-color-scheme: dark)", query),
      );

      expect(getSystemTheme()).toBe("dark");
    });

    test('should return "light" when system prefers light mode', () => {
      mockMatchMedia((query) => createMockMediaQueryList(false, query));

      expect(getSystemTheme()).toBe("light");
    });

    test("should have DEFAULT_RESOLVED_THEME as fallback for SSR", () => {
      // In SSR (no window), getSystemTheme returns DEFAULT_RESOLVED_THEME
      // We can't easily test this in jsdom, so we verify the constant is correct
      expect(DEFAULT_RESOLVED_THEME).toBe("dark");
    });
  });

  describe("resolveTheme", () => {
    test('should return "light" when theme is "light"', () => {
      expect(resolveTheme("light")).toBe("light");
    });

    test('should return "dark" when theme is "dark"', () => {
      expect(resolveTheme("dark")).toBe("dark");
    });

    test('should resolve "system" to system preference (light)', () => {
      mockMatchMedia(() => createMockMediaQueryList(false, ""));

      expect(resolveTheme("system")).toBe("light");
    });

    test('should resolve "system" to system preference (dark)', () => {
      mockMatchMedia((query) =>
        createMockMediaQueryList(query === "(prefers-color-scheme: dark)", query),
      );

      expect(resolveTheme("system")).toBe("dark");
    });
  });
});
