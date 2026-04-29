import { render } from "@testing-library/react";

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
      // but the variable will be set to the explicit theme
      expect(lightContainer.querySelector("script")?.innerHTML).toContain('theme="light"');
      expect(darkContainer.querySelector("script")?.innerHTML).toContain('theme="dark"');
    });
  });
});
