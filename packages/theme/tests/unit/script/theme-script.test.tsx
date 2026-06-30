import { render } from "@testing-library/react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { AppearanceScript } from "#/script/theme-script";

describe("AppearanceScript", () => {
  describe("rendering", () => {
    test("should render a script tag", () => {
      const { container } = render(<AppearanceScript colorScheme="dark" />);

      const script = container.querySelector("script");

      expect(script).toBeInTheDocument();
    });

    test("should render script with dangerouslySetInnerHTML", () => {
      const { container } = render(<AppearanceScript colorScheme="light" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toBeTruthy();
    });

    test("should apply nonce when provided", () => {
      const { container } = render(<AppearanceScript nonce="test-nonce" colorScheme="dark" />);

      const script = container.querySelector("script");

      expect(script).toHaveAttribute("nonce", "test-nonce");
    });

    test("should not set nonce when omitted", () => {
      const { container } = render(<AppearanceScript colorScheme="dark" />);

      const script = container.querySelector("script");

      expect(script).not.toHaveAttribute("nonce");
    });

    test("should suppress hydration warning when script content differs", async () => {
      const html = renderToString(<AppearanceScript colorScheme="light" />);
      const container = document.createElement("div");
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      container.innerHTML = html;

      let root: ReturnType<typeof hydrateRoot> | undefined;

      await act(async () => {
        root = hydrateRoot(container, <AppearanceScript colorScheme="dark" />);
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
    test('should include color scheme value in script for "light"', () => {
      const { container } = render(<AppearanceScript colorScheme="light" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('"light"');
    });

    test('should include color scheme value in script for "dark"', () => {
      const { container } = render(<AppearanceScript colorScheme="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('"dark"');
    });

    test('should include color scheme value in script for "automatic"', () => {
      const { container } = render(<AppearanceScript colorScheme="automatic" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('"automatic"');
    });

    test("should contain matchMedia check for automatic color scheme", () => {
      const { container } = render(<AppearanceScript colorScheme="automatic" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("matchMedia");
      expect(script?.innerHTML).toContain("prefers-color-scheme");
    });

    test("should contain documentElement class manipulation", () => {
      const { container } = render(<AppearanceScript colorScheme="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("documentElement");
      expect(script?.innerHTML).toContain("classList");
    });

    test("should remove prior color scheme classes before add (SSR automatic vs client OS)", () => {
      const { container } = render(<AppearanceScript colorScheme="automatic" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('classList.remove("light","dark","automatic")');
      expect(script?.innerHTML).toContain("classList.add(resolvedTheme)");
    });

    test("should contain colorScheme assignment", () => {
      const { container } = render(<AppearanceScript colorScheme="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("colorScheme");
    });

    test("should write the preference to data-appearance for preference-aware CSS", () => {
      const { container } = render(<AppearanceScript colorScheme="dark" />);

      const script = container.querySelector("script");

      // `theme` holds the preference (pre-resolution), so the dataset reflects automatic/light/dark.
      expect(script?.innerHTML).toContain("dataset.appearance=theme");
    });

    test("should be wrapped in IIFE", () => {
      const { container } = render(<AppearanceScript colorScheme="dark" />);

      const script = container.querySelector("script");

      // Check for IIFE pattern: (function(){...})()
      expect(script?.innerHTML).toMatch(/^\(function\(\)\{.*\}\)\(\)$/);
    });

    test("should include try-catch for error handling", () => {
      const { container } = render(<AppearanceScript colorScheme="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("try");
      expect(script?.innerHTML).toContain("catch");
    });
  });

  describe("storageKey prop", () => {
    test("includes storageKey in script when provided", () => {
      const { container } = render(<AppearanceScript storageKey="my-color-scheme" colorScheme="automatic" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('"my-color-scheme"');
    });

    test("reads localStorage key in script content when storageKey is set", () => {
      const { container } = render(<AppearanceScript storageKey="app-color-scheme" colorScheme="light" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("localStorage.getItem");
      expect(script?.innerHTML).toContain('"app-color-scheme"');
    });

    test("uses null for sk when storageKey is omitted (backward-compatible path)", () => {
      const { container } = render(<AppearanceScript colorScheme="dark" />);

      const script = container.querySelector("script");

      // sk=null means localStorage branch is skipped; fbt (fallback color scheme) is used directly
      expect(script?.innerHTML).toContain("sk=null");
    });

    test("uses colorScheme prop as fallback (fbt) in script", () => {
      const { container } = render(<AppearanceScript storageKey="ui-color-scheme" colorScheme="light" />);

      const script = container.querySelector("script");

      // fbt should be the serialised fallback color scheme
      expect(script?.innerHTML).toContain('fbt="light"');
    });

    test("falls back to colorScheme prop when storageKey is omitted", () => {
      const { container } = render(<AppearanceScript colorScheme="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('fbt="dark"');
    });
  });

  describe("color-scheme-specific behavior", () => {
    test('should handle "automatic" color scheme with dark mode resolution', () => {
      const { container } = render(<AppearanceScript colorScheme="automatic" />);

      const script = container.querySelector("script");

      // Script should check if "automatic" === theme and resolve accordingly
      expect(script?.innerHTML).toContain('"automatic"===theme');
    });

    test("explicit color schemes should not check system preference via automatic branch", () => {
      const { container: lightContainer } = render(<AppearanceScript colorScheme="light" />);
      const { container: darkContainer } = render(<AppearanceScript colorScheme="dark" />);

      // Both should still contain the automatic check logic (same script template)
      // but the fallback color scheme (fbt) is set to the explicit value
      expect(lightContainer.querySelector("script")?.innerHTML).toContain('fbt="light"');
      expect(darkContainer.querySelector("script")?.innerHTML).toContain('fbt="dark"');
    });
  });
});
