import type { ReactElement } from "react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { AppearanceScript } from "#appearance-script";
import { DEFAULT_APPEARANCE, STORAGE_KEY } from "#constants";

/** Server-renders the script as it ships: React never runs a script it creates on the client, and warns about one. */
function renderScript(element: ReactElement): HTMLScriptElement | null {
  const container = document.createElement("div");

  container.innerHTML = renderToString(element);

  return container.querySelector("script");
}

describe("AppearanceScript", () => {
  describe("rendering", () => {
    test("should render a script tag", () => {
      const script = renderScript(<AppearanceScript appearance="dark" />);

      expect(script).not.toBeNull();
    });

    test("should render script with dangerouslySetInnerHTML", () => {
      const script = renderScript(<AppearanceScript appearance="light" />);

      expect(script?.innerHTML).toBeTruthy();
    });

    test("should apply nonce when provided", () => {
      const script = renderScript(<AppearanceScript nonce="test-nonce" appearance="dark" />);

      expect(script).toHaveAttribute("nonce", "test-nonce");
    });

    test("should not set nonce when omitted", () => {
      const script = renderScript(<AppearanceScript appearance="dark" />);

      expect(script).not.toHaveAttribute("nonce");
    });

    test("should suppress hydration warning when script content differs", async () => {
      const html = renderToString(<AppearanceScript appearance="light" />);
      const container = document.createElement("div");
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      container.innerHTML = html;

      let root: ReturnType<typeof hydrateRoot> | undefined;

      await act(async () => {
        root = hydrateRoot(container, <AppearanceScript appearance="dark" />);
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
      const script = renderScript(<AppearanceScript appearance="light" />);

      expect(script?.innerHTML).toContain('"light"');
    });

    test('should include color scheme value in script for "dark"', () => {
      const script = renderScript(<AppearanceScript appearance="dark" />);

      expect(script?.innerHTML).toContain('"dark"');
    });

    test('should include color scheme value in script for "automatic"', () => {
      const script = renderScript(<AppearanceScript appearance="automatic" />);

      expect(script?.innerHTML).toContain('"automatic"');
    });

    test("should contain matchMedia check for automatic color scheme", () => {
      const script = renderScript(<AppearanceScript appearance="automatic" />);

      expect(script?.innerHTML).toContain("matchMedia");
      expect(script?.innerHTML).toContain("prefers-color-scheme");
    });

    test("should contain documentElement class manipulation", () => {
      const script = renderScript(<AppearanceScript appearance="dark" />);

      expect(script?.innerHTML).toContain("documentElement");
      expect(script?.innerHTML).toContain("classList");
    });

    test("should remove prior color scheme classes before add (SSR automatic vs client OS)", () => {
      const script = renderScript(<AppearanceScript appearance="automatic" />);

      expect(script?.innerHTML).toContain('classList.remove("light","dark","automatic")');
      expect(script?.innerHTML).toContain("classList.add(colorScheme)");
    });

    test("should contain colorScheme assignment", () => {
      const script = renderScript(<AppearanceScript appearance="dark" />);

      expect(script?.innerHTML).toContain("colorScheme");
    });

    test("should write the preference to data-appearance for preference-aware CSS", () => {
      const script = renderScript(<AppearanceScript appearance="dark" />);

      // `theme` holds the preference (pre-resolution), so the dataset reflects automatic/light/dark.
      expect(script?.innerHTML).toContain("dataset.appearance=appearance");
    });

    test("should be wrapped in IIFE", () => {
      const script = renderScript(<AppearanceScript appearance="dark" />);

      // Check for IIFE pattern: (function(){...})()
      expect(script?.innerHTML).toMatch(/^\(function\(\)\{.*\}\)\(\)$/);
    });

    test("should include try-catch for error handling", () => {
      const script = renderScript(<AppearanceScript appearance="dark" />);

      expect(script?.innerHTML).toContain("try");
      expect(script?.innerHTML).toContain("catch");
    });
  });

  describe("storageKey prop", () => {
    test("includes storageKey in script when provided", () => {
      const script = renderScript(<AppearanceScript storageKey="my-color-scheme" appearance="automatic" />);

      expect(script?.innerHTML).toContain('"my-color-scheme"');
    });

    test("reads localStorage key in script content when storageKey is set", () => {
      const script = renderScript(<AppearanceScript storageKey="app-color-scheme" appearance="light" />);

      expect(script?.innerHTML).toContain("localStorage.getItem");
      expect(script?.innerHTML).toContain('"app-color-scheme"');
    });

    test("defaults sk to STORAGE_KEY when storageKey is omitted", () => {
      const script = renderScript(<AppearanceScript appearance="dark" />);

      expect(script?.innerHTML).toContain(`sk="${STORAGE_KEY}"`);
    });

    test("uses colorScheme prop as fallback (fb) in script", () => {
      const script = renderScript(<AppearanceScript storageKey="ui-color-scheme" appearance="light" />);

      // fb should be the serialised fallback color scheme
      expect(script?.innerHTML).toContain('fb="light"');
    });

    test("defaults fb to DEFAULT_APPEARANCE when colorScheme is omitted", () => {
      const script = renderScript(<AppearanceScript />);

      expect(script?.innerHTML).toContain(`fb="${DEFAULT_APPEARANCE}"`);
    });
  });

  describe("color-scheme-specific behavior", () => {
    test('should handle "automatic" color scheme with dark mode resolution', () => {
      const script = renderScript(<AppearanceScript appearance="automatic" />);

      // Script should check if "automatic" === theme and resolve accordingly
      expect(script?.innerHTML).toContain('"automatic"===appearance');
    });

    test("explicit color schemes should not check system preference via automatic branch", () => {
      // Both should still contain the automatic check logic (same script template)
      // but the fallback color scheme (fb) is set to the explicit value
      expect(renderScript(<AppearanceScript appearance="light" />)?.innerHTML).toContain('fb="light"');
      expect(renderScript(<AppearanceScript appearance="dark" />)?.innerHTML).toContain('fb="dark"');
    });
  });
});
