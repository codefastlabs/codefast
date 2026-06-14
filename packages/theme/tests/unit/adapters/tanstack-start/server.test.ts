import type { ResolvedColorScheme, ColorScheme } from "#/types";

// vi.hoisted ensures these are initialised before the vi.mock factory runs (vi.mock is hoisted)
const { mockGetCookie, mockGetRequestHeader, mockSetCookie } = vi.hoisted(() => ({
  mockGetCookie: vi.fn<(name: string) => string | undefined>(),
  mockGetRequestHeader: vi.fn<(name: string) => string | undefined>(),
  mockSetCookie: vi.fn<(name: string, value: string, options: object) => void>(),
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: vi.fn().mockImplementation(() => ({
    handler: (fn: unknown) => fn,
    validator: () => ({
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
  getRootColorSchemeServerFn,
  getSsrColorSchemeServerFn,
  getColorSchemeServerFn,
  persistColorSchemeCookie,
  setColorSchemeServerFn,
} = await import("#/adapters/tanstack-start/server");

describe("TanStack Start adapter — server functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCookie.mockReturnValue(undefined);
    mockGetRequestHeader.mockReturnValue(undefined);
  });

  describe("getColorSchemeServerFn", () => {
    test("returns DEFAULT_COLOR_SCHEME ('automatic') when cookie is absent", () => {
      const result = (getColorSchemeServerFn as unknown as () => ColorScheme)();

      expect(result).toBe("automatic");
    });

    test("returns 'light' when cookie holds 'light'", () => {
      mockGetCookie.mockReturnValue("light");

      const result = (getColorSchemeServerFn as unknown as () => ColorScheme)();

      expect(result).toBe("light");
    });

    test("returns 'dark' when cookie holds 'dark'", () => {
      mockGetCookie.mockReturnValue("dark");

      const result = (getColorSchemeServerFn as unknown as () => ColorScheme)();

      expect(result).toBe("dark");
    });

    test("returns DEFAULT_COLOR_SCHEME for an invalid cookie value", () => {
      mockGetCookie.mockReturnValue("invalid-value");

      const result = (getColorSchemeServerFn as unknown as () => ColorScheme)();

      expect(result).toBe("automatic");
    });

    test("returns DEFAULT_COLOR_SCHEME for an empty string cookie", () => {
      mockGetCookie.mockReturnValue("");

      const result = (getColorSchemeServerFn as unknown as () => ColorScheme)();

      expect(result).toBe("automatic");
    });
  });

  describe("getSsrColorSchemeServerFn", () => {
    test("returns DEFAULT_RESOLVED_COLOR_SCHEME ('dark') when no hint header is present", () => {
      const result = (getSsrColorSchemeServerFn as unknown as () => ResolvedColorScheme)();

      expect(result).toBe("dark");
    });

    test("returns 'dark' from Sec-CH-Prefers-Color-Scheme: dark", () => {
      mockGetRequestHeader.mockImplementation((name) => (name === "Sec-CH-Prefers-Color-Scheme" ? "dark" : undefined));

      const result = (getSsrColorSchemeServerFn as unknown as () => ResolvedColorScheme)();

      expect(result).toBe("dark");
    });

    test("returns 'light' from Sec-CH-Prefers-Color-Scheme: light", () => {
      mockGetRequestHeader.mockImplementation((name) => (name === "Sec-CH-Prefers-Color-Scheme" ? "light" : undefined));

      const result = (getSsrColorSchemeServerFn as unknown as () => ResolvedColorScheme)();

      expect(result).toBe("light");
    });

    test("falls back to Prefers-Color-Scheme header when Sec-CH header is absent", () => {
      mockGetRequestHeader.mockImplementation((name) => (name === "Prefers-Color-Scheme" ? "light" : undefined));

      const result = (getSsrColorSchemeServerFn as unknown as () => ResolvedColorScheme)();

      expect(result).toBe("light");
    });

    test("returns DEFAULT_RESOLVED_COLOR_SCHEME for an unrecognised hint value", () => {
      mockGetRequestHeader.mockReturnValue("unknown");

      const result = (getSsrColorSchemeServerFn as unknown as () => ResolvedColorScheme)();

      expect(result).toBe("dark");
    });
  });

  describe("getRootColorSchemeServerFn", () => {
    test("returns combined colorScheme and ssrColorScheme", () => {
      mockGetCookie.mockReturnValue("light");
      mockGetRequestHeader.mockImplementation((name) => (name === "Sec-CH-Prefers-Color-Scheme" ? "dark" : undefined));

      const result = (
        getRootColorSchemeServerFn as unknown as () => {
          ssrColorScheme: ResolvedColorScheme;
          colorScheme: ColorScheme;
        }
      )();

      expect(result).toStrictEqual({ colorScheme: "light", ssrColorScheme: "dark" });
    });

    test("returns DEFAULT_COLOR_SCHEME and DEFAULT_RESOLVED_COLOR_SCHEME when nothing is set", () => {
      const result = (
        getRootColorSchemeServerFn as unknown as () => {
          ssrColorScheme: ResolvedColorScheme;
          colorScheme: ColorScheme;
        }
      )();

      expect(result).toStrictEqual({ colorScheme: "automatic", ssrColorScheme: "dark" });
    });
  });

  describe("setColorSchemeServerFn", () => {
    test("calls setCookie with the correct cookie name, value, and security options", () => {
      (setColorSchemeServerFn as unknown as (args: { data: ColorScheme }) => void)({
        data: "dark",
      });

      expect(mockSetCookie).toHaveBeenCalledWith("ui-theme", "dark", {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax",
        secure: false, // NODE_ENV is 'test', not 'production'
      });
    });

    test("persists 'light' color scheme with correct cookie name", () => {
      (setColorSchemeServerFn as unknown as (args: { data: ColorScheme }) => void)({
        data: "light",
      });

      expect(mockSetCookie).toHaveBeenCalledWith(
        "ui-theme",
        "light",
        expect.objectContaining({ httpOnly: true, path: "/" }),
      );
    });

    test("persists 'automatic' color scheme", () => {
      (setColorSchemeServerFn as unknown as (args: { data: ColorScheme }) => void)({
        data: "automatic",
      });

      expect(mockSetCookie).toHaveBeenCalledWith("ui-theme", "automatic", expect.objectContaining({ httpOnly: true }));
    });
  });

  describe("persistColorSchemeCookie", () => {
    test("delegates to setColorSchemeServerFn — calls setCookie with the given color scheme", async () => {
      await persistColorSchemeCookie("automatic");

      expect(mockSetCookie).toHaveBeenCalledWith("ui-theme", "automatic", expect.objectContaining({ httpOnly: true }));
    });

    test("delegates 'dark' color scheme correctly", async () => {
      await persistColorSchemeCookie("dark");

      expect(mockSetCookie).toHaveBeenCalledWith("ui-theme", "dark", expect.any(Object));
    });
  });
});
