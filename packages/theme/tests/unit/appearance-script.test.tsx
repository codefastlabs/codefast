import { render } from "@testing-library/react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import { AppearanceScript } from "#/appearance-script";
import { DEFAULT_APPEARANCE, STORAGE_KEY } from "#/constants";

describe("AppearanceScript", () => {
  describe("rendering", () => {
    test("should render a script tag", () => {
      const { container } = render(<AppearanceScript appearance="dark" />);

      const script = container.querySelector("script");

      expect(script).toBeInTheDocument();
    });

    test("should render script with dangerouslySetInnerHTML", () => {
      const { container } = render(<AppearanceScript appearance="light" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toBeTruthy();
    });

    test("should apply nonce when provided", () => {
      const { container } = render(<AppearanceScript nonce="test-nonce" appearance="dark" />);

      const script = container.querySelector("script");

      expect(script).toHaveAttribute("nonce", "test-nonce");
    });

    test("should not set nonce when omitted", () => {
      const { container } = render(<AppearanceScript appearance="dark" />);

      const script = container.querySelector("script");

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
      const { container } = render(<AppearanceScript appearance="light" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('"light"');
    });

    test('should include color scheme value in script for "dark"', () => {
      const { container } = render(<AppearanceScript appearance="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('"dark"');
    });

    test('should include color scheme value in script for "automatic"', () => {
      const { container } = render(<AppearanceScript appearance="automatic" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('"automatic"');
    });

    test("should contain matchMedia check for automatic color scheme", () => {
      const { container } = render(<AppearanceScript appearance="automatic" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("matchMedia");
      expect(script?.innerHTML).toContain("prefers-color-scheme");
    });

    test("should contain documentElement class manipulation", () => {
      const { container } = render(<AppearanceScript appearance="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("documentElement");
      expect(script?.innerHTML).toContain("classList");
    });

    test("should remove prior color scheme classes before add (SSR automatic vs client OS)", () => {
      const { container } = render(<AppearanceScript appearance="automatic" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('classList.remove("light","dark","automatic")');
      expect(script?.innerHTML).toContain("classList.add(colorScheme)");
    });

    test("should contain colorScheme assignment", () => {
      const { container } = render(<AppearanceScript appearance="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("colorScheme");
    });

    test("should write the preference to data-appearance for preference-aware CSS", () => {
      const { container } = render(<AppearanceScript appearance="dark" />);

      const script = container.querySelector("script");

      // `theme` holds the preference (pre-resolution), so the dataset reflects automatic/light/dark.
      expect(script?.innerHTML).toContain("dataset.appearance=appearance");
    });

    test("should be wrapped in IIFE", () => {
      const { container } = render(<AppearanceScript appearance="dark" />);

      const script = container.querySelector("script");

      // Check for IIFE pattern: (function(){...})()
      expect(script?.innerHTML).toMatch(/^\(function\(\)\{.*\}\)\(\)$/);
    });

    test("should include try-catch for error handling", () => {
      const { container } = render(<AppearanceScript appearance="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("try");
      expect(script?.innerHTML).toContain("catch");
    });
  });

  describe("storageKey prop", () => {
    test("includes storageKey in script when provided", () => {
      const { container } = render(<AppearanceScript storageKey="my-color-scheme" appearance="automatic" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain('"my-color-scheme"');
    });

    test("reads localStorage key in script content when storageKey is set", () => {
      const { container } = render(<AppearanceScript storageKey="app-color-scheme" appearance="light" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain("localStorage.getItem");
      expect(script?.innerHTML).toContain('"app-color-scheme"');
    });

    test("defaults sk to STORAGE_KEY when storageKey is omitted", () => {
      const { container } = render(<AppearanceScript appearance="dark" />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain(`sk="${STORAGE_KEY}"`);
    });

    test("uses colorScheme prop as fallback (fb) in script", () => {
      const { container } = render(<AppearanceScript storageKey="ui-color-scheme" appearance="light" />);

      const script = container.querySelector("script");

      // fb should be the serialised fallback color scheme
      expect(script?.innerHTML).toContain('fb="light"');
    });

    test("defaults fb to DEFAULT_APPEARANCE when colorScheme is omitted", () => {
      const { container } = render(<AppearanceScript />);

      const script = container.querySelector("script");

      expect(script?.innerHTML).toContain(`fb="${DEFAULT_APPEARANCE}"`);
    });
  });

  describe("color-scheme-specific behavior", () => {
    test('should handle "automatic" color scheme with dark mode resolution', () => {
      const { container } = render(<AppearanceScript appearance="automatic" />);

      const script = container.querySelector("script");

      // Script should check if "automatic" === theme and resolve accordingly
      expect(script?.innerHTML).toContain('"automatic"===appearance');
    });

    test("explicit color schemes should not check system preference via automatic branch", () => {
      const { container: lightContainer } = render(<AppearanceScript appearance="light" />);
      const { container: darkContainer } = render(<AppearanceScript appearance="dark" />);

      // Both should still contain the automatic check logic (same script template)
      // but the fallback color scheme (fb) is set to the explicit value
      expect(lightContainer.querySelector("script")?.innerHTML).toContain('fb="light"');
      expect(darkContainer.querySelector("script")?.innerHTML).toContain('fb="dark"');
    });
  });
});
