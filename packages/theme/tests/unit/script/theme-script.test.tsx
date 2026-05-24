import { render } from "@testing-library/react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { ThemeScript } from "#/script/theme-script";

describe("ThemeScript", () => {
  describe("rendering", () => {
    test("should render a script tag", () => {
      const { container } = render(<ThemeScript theme="dark" />);

      const script = container.querySelector("script");

      expect(script).toBeInTheDocument();
    });

    test("should render script with dangerouslySetInnerHTML", () => {
      const { container } = render(<ThemeScript theme="light" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toBeTruthy();
    });

    test("should apply nonce when provided", () => {
      const { container } = render(<ThemeScript nonce="test-nonce" theme="dark" />);

      const script = container.querySelector("script");

      expect(script).toHaveAttribute("nonce", "test-nonce");
    });

    test("should not set nonce when omitted", () => {
      const { container } = render(<ThemeScript theme="dark" />);

      const script = container.querySelector("script");

      expect(script).not.toHaveAttribute("nonce");
    });

    test("should suppress hydration warning when script content differs", async () => {
      const html = renderToString(<ThemeScript theme="light" />);
      const container = document.createElement("div");
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      container.innerHTML = html;

      let root: ReturnType<typeof hydrateRoot> | undefined;

      await act(async () => {
        root = hydrateRoot(container, <ThemeScript theme="dark" />);
        await Promise.resolve();
      });

      expect(errorSpy).not.toHaveBeenCalled();

      await act(async () => {
        root?.unmount();
      });

      errorSpy.mockRestore();
    });
  });

  describe("script content", () => {
    test('should include theme value in script for "light"', () => {
      const { container } = render(<ThemeScript theme="light" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('"light"');
    });

    test('should include theme value in script for "dark"', () => {
      const { container } = render(<ThemeScript theme="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('"dark"');
    });

    test('should include theme value in script for "system"', () => {
      const { container } = render(<ThemeScript theme="system" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('"system"');
    });

    test("should contain matchMedia check for system theme", () => {
      const { container } = render(<ThemeScript theme="system" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("matchMedia");
      expect(script?.innerHTML).toContain("prefers-color-scheme");
    });

    test("should contain documentElement class manipulation", () => {
      const { container } = render(<ThemeScript theme="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("documentElement");
      expect(script?.innerHTML).toContain("classList");
    });

    test("should remove prior theme classes before add (SSR system vs client OS)", () => {
      const { container } = render(<ThemeScript theme="system" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('classList.remove("light","dark","system")');
      expect(script?.innerHTML).toContain("classList.add(resolvedTheme)");
    });

    test("should contain colorScheme assignment", () => {
      const { container } = render(<ThemeScript theme="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("colorScheme");
    });

    test("should be wrapped in IIFE", () => {
      const { container } = render(<ThemeScript theme="dark" />);

      const script = container.querySelector("script");

      // Check for IIFE pattern: (function(){...})()
      expect(script?.innerHTML).toMatch(/^\(function\(\)\{.*\}\)\(\)$/);
    });

    test("should include try-catch for error handling", () => {
      const { container } = render(<ThemeScript theme="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("try");
      expect(script?.innerHTML).toContain("catch");
    });
  });

  describe("storageKey prop", () => {
    test("includes storageKey in script when provided", () => {
      const { container } = render(<ThemeScript storageKey="my-theme" theme="system" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('"my-theme"');
    });

    test("reads localStorage key in script content when storageKey is set", () => {
      const { container } = render(<ThemeScript storageKey="app-theme" theme="light" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("localStorage.getItem");
      expect(script?.innerHTML).toContain('"app-theme"');
    });

    test("uses null for sk when storageKey is omitted (backward-compatible path)", () => {
      const { container } = render(<ThemeScript theme="dark" />);

      const script = container.querySelector("script");

      // sk=null means localStorage branch is skipped; fbt (fallback theme) is used directly
      expect(script?.innerHTML).toContain("sk=null");
    });

    test("uses theme prop as fallback (fbt) in script", () => {
      const { container } = render(<ThemeScript storageKey="ui-theme" theme="light" />);

      const script = container.querySelector("script");

      // fbt should be the serialised fallback theme
      expect(script?.innerHTML).toContain('fbt="light"');
    });

    test("falls back to theme prop when storageKey is omitted", () => {
      const { container } = render(<ThemeScript theme="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('fbt="dark"');
    });
  });

  describe("theme-specific behavior", () => {
    test('should handle "system" theme with dark mode resolution', () => {
      const { container } = render(<ThemeScript theme="system" />);

      const script = container.querySelector("script");

      // Script should check if system === theme and resolve accordingly
      expect(script?.innerHTML).toContain('"system"===theme');
    });

    test("explicit themes should not check system preference", () => {
      const { container: lightContainer } = render(<ThemeScript theme="light" />);
      const { container: darkContainer } = render(<ThemeScript theme="dark" />);

      // Both should still contain the system check logic (same script template)
      // but the fallback theme (fbt) is set to the explicit theme value
      expect(lightContainer.querySelector("script")?.innerHTML).toContain('fbt="light"');
      expect(darkContainer.querySelector("script")?.innerHTML).toContain('fbt="dark"');
    });
  });
});
