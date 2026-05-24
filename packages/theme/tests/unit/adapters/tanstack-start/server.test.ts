import type { ResolvedTheme, Theme } from "#/types";

// vi.hoisted ensures these are initialised before the vi.mock factory runs (vi.mock is hoisted)
const { mockGetCookie, mockGetRequestHeader, mockSetCookie } = vi.hoisted(() => ({
  mockGetCookie: vi.fn<(name: string) => string | undefined>(),
  mockGetRequestHeader: vi.fn<(name: string) => string | undefined>(),
  mockSetCookie: vi.fn<(name: string, value: string, options: object) => void>(),
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: vi.fn().mockImplementation(() => ({
    handler: (fn: unknown) => fn,
    inputValidator: () => ({
      handler: (fn: unknown) => fn,
    }),
  })),
}));

vi.mock("@tanstack/react-start/server", () => ({
  getCookie: mockGetCookie,
  getRequestHeader: mockGetRequestHeader,
  setCookie: mockSetCookie,
}));

const {
  getRootThemeServerFn,
  getSsrSystemThemeServerFn,
  getThemeServerFn,
  persistThemeCookie,
  setThemeServerFn,
} = await import("#/adapters/tanstack-start/server");

describe("TanStack Start adapter — server functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCookie.mockReturnValue(undefined);
    mockGetRequestHeader.mockReturnValue(undefined);
  });

  describe("getThemeServerFn", () => {
    test("returns DEFAULT_THEME ('system') when cookie is absent", () => {
      const result = (getThemeServerFn as unknown as () => Theme)();

      expect(result).toBe("system");
    });

    test("returns 'light' when cookie holds 'light'", () => {
      mockGetCookie.mockReturnValue("light");

      const result = (getThemeServerFn as unknown as () => Theme)();

      expect(result).toBe("light");
    });

    test("returns 'dark' when cookie holds 'dark'", () => {
      mockGetCookie.mockReturnValue("dark");

      const result = (getThemeServerFn as unknown as () => Theme)();

      expect(result).toBe("dark");
    });

    test("returns DEFAULT_THEME for an invalid cookie value", () => {
      mockGetCookie.mockReturnValue("invalid-value");

      const result = (getThemeServerFn as unknown as () => Theme)();

      expect(result).toBe("system");
    });

    test("returns DEFAULT_THEME for an empty string cookie", () => {
      mockGetCookie.mockReturnValue("");

      const result = (getThemeServerFn as unknown as () => Theme)();

      expect(result).toBe("system");
    });
  });

  describe("getSsrSystemThemeServerFn", () => {
    test("returns DEFAULT_RESOLVED_THEME ('dark') when no hint header is present", () => {
      const result = (getSsrSystemThemeServerFn as unknown as () => ResolvedTheme)();

      expect(result).toBe("dark");
    });

    test("returns 'dark' from Sec-CH-Prefers-Color-Scheme: dark", () => {
      mockGetRequestHeader.mockImplementation((name) =>
        name === "Sec-CH-Prefers-Color-Scheme" ? "dark" : undefined,
      );

      const result = (getSsrSystemThemeServerFn as unknown as () => ResolvedTheme)();

      expect(result).toBe("dark");
    });

    test("returns 'light' from Sec-CH-Prefers-Color-Scheme: light", () => {
      mockGetRequestHeader.mockImplementation((name) =>
        name === "Sec-CH-Prefers-Color-Scheme" ? "light" : undefined,
      );

      const result = (getSsrSystemThemeServerFn as unknown as () => ResolvedTheme)();

      expect(result).toBe("light");
    });

    test("falls back to Prefers-Color-Scheme header when Sec-CH header is absent", () => {
      mockGetRequestHeader.mockImplementation((name) =>
        name === "Prefers-Color-Scheme" ? "light" : undefined,
      );

      const result = (getSsrSystemThemeServerFn as unknown as () => ResolvedTheme)();

      expect(result).toBe("light");
    });

    test("returns DEFAULT_RESOLVED_THEME for an unrecognised hint value", () => {
      mockGetRequestHeader.mockReturnValue("unknown");

      const result = (getSsrSystemThemeServerFn as unknown as () => ResolvedTheme)();

      expect(result).toBe("dark");
    });
  });

  describe("getRootThemeServerFn", () => {
    test("returns combined theme and ssrSystemTheme", () => {
      mockGetCookie.mockReturnValue("light");
      mockGetRequestHeader.mockImplementation((name) =>
        name === "Sec-CH-Prefers-Color-Scheme" ? "dark" : undefined,
      );

      const result = (
        getRootThemeServerFn as unknown as () => { ssrSystemTheme: ResolvedTheme; theme: Theme }
      )();

      expect(result).toStrictEqual({ theme: "light", ssrSystemTheme: "dark" });
    });

    test("returns DEFAULT_THEME and DEFAULT_RESOLVED_THEME when nothing is set", () => {
      const result = (
        getRootThemeServerFn as unknown as () => { ssrSystemTheme: ResolvedTheme; theme: Theme }
      )();

      expect(result).toStrictEqual({ theme: "system", ssrSystemTheme: "dark" });
    });
  });

  describe("setThemeServerFn", () => {
    test("calls setCookie with the correct cookie name, value, and security options", () => {
      (setThemeServerFn as unknown as (args: { data: Theme }) => void)({ data: "dark" });

      expect(mockSetCookie).toHaveBeenCalledWith("ui-theme", "dark", {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax",
        secure: false, // NODE_ENV is 'test', not 'production'
      });
    });

    test("persists 'light' theme with correct cookie name", () => {
      (setThemeServerFn as unknown as (args: { data: Theme }) => void)({ data: "light" });

      expect(mockSetCookie).toHaveBeenCalledWith(
        "ui-theme",
        "light",
        expect.objectContaining({ httpOnly: true, path: "/" }),
      );
    });

    test("persists 'system' theme", () => {
      (setThemeServerFn as unknown as (args: { data: Theme }) => void)({ data: "system" });

      expect(mockSetCookie).toHaveBeenCalledWith(
        "ui-theme",
        "system",
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe("persistThemeCookie", () => {
    test("delegates to setThemeServerFn — calls setCookie with the given theme", async () => {
      await persistThemeCookie("system");

      expect(mockSetCookie).toHaveBeenCalledWith(
        "ui-theme",
        "system",
        expect.objectContaining({ httpOnly: true }),
      );
    });

    test("delegates 'dark' theme correctly", async () => {
      await persistThemeCookie("dark");

      expect(mockSetCookie).toHaveBeenCalledWith("ui-theme", "dark", expect.any(Object));
    });
  });
});
