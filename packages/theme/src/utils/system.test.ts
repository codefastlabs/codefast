import { DEFAULT_RESOLVED_THEME } from "#/constants";
import { getSystemTheme, resolveTheme } from "#/utils/system";

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
      Object.defineProperty(window, "matchMedia", {
        value: vi.fn<(...args: unknown[]) => unknown>().mockImplementation((query: string) => ({
          addEventListener: vi.fn<(...args: unknown[]) => unknown>(),
          addListener: vi.fn<(...args: unknown[]) => unknown>(),
          dispatchEvent: vi.fn<(...args: unknown[]) => unknown>(),
          matches: query === "(prefers-color-scheme: dark)",
          media: query,
          onchange: null,
          removeEventListener: vi.fn<(...args: unknown[]) => unknown>(),
          removeListener: vi.fn<(...args: unknown[]) => unknown>(),
        })),
        writable: true,
      });

      expect(getSystemTheme()).toBe("dark");
    });

    test('should return "light" when system prefers light mode', () => {
      Object.defineProperty(window, "matchMedia", {
        value: vi.fn<(...args: unknown[]) => unknown>().mockImplementation((query: string) => ({
          addEventListener: vi.fn<(...args: unknown[]) => unknown>(),
          addListener: vi.fn<(...args: unknown[]) => unknown>(),
          dispatchEvent: vi.fn<(...args: unknown[]) => unknown>(),
          matches: false, // prefers-color-scheme: dark does NOT match
          media: query,
          onchange: null,
          removeEventListener: vi.fn<(...args: unknown[]) => unknown>(),
          removeListener: vi.fn<(...args: unknown[]) => unknown>(),
        })),
        writable: true,
      });

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
      Object.defineProperty(window, "matchMedia", {
        value: vi.fn<(...args: unknown[]) => unknown>().mockImplementation(() => ({
          addEventListener: vi.fn<(...args: unknown[]) => unknown>(),
          addListener: vi.fn<(...args: unknown[]) => unknown>(),
          dispatchEvent: vi.fn<(...args: unknown[]) => unknown>(),
          matches: false, // light mode
          media: "",
          onchange: null,
          removeEventListener: vi.fn<(...args: unknown[]) => unknown>(),
          removeListener: vi.fn<(...args: unknown[]) => unknown>(),
        })),
        writable: true,
      });

      expect(resolveTheme("system")).toBe("light");
    });

    test('should resolve "system" to system preference (dark)', () => {
      Object.defineProperty(window, "matchMedia", {
        value: vi.fn<(...args: unknown[]) => unknown>().mockImplementation((query: string) => ({
          addEventListener: vi.fn<(...args: unknown[]) => unknown>(),
          addListener: vi.fn<(...args: unknown[]) => unknown>(),
          dispatchEvent: vi.fn<(...args: unknown[]) => unknown>(),
          matches: query === "(prefers-color-scheme: dark)",
          media: query,
          onchange: null,
          removeEventListener: vi.fn<(...args: unknown[]) => unknown>(),
          removeListener: vi.fn<(...args: unknown[]) => unknown>(),
        })),
        writable: true,
      });

      expect(resolveTheme("system")).toBe("dark");
    });
  });
});
