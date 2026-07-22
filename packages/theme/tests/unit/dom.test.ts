import { applyColorScheme, suppressTransitions } from "#/dom";
import { createMockMediaQueryList, mockMatchMedia } from "#/tests/unit/support/mocks";

describe("DOM Utilities", () => {
  describe("applyColorScheme", () => {
    beforeEach(() => {
      // Reset documentElement classes and styles before each test
      document.documentElement.className = "";
      document.documentElement.style.colorScheme = "";
    });

    test('should add "light" class to html element', () => {
      applyColorScheme("light");

      expect(document.documentElement.classList.contains("light")).toBe(true);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    test('should add "dark" class to html element', () => {
      applyColorScheme("dark");

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
    });

    test('should set colorScheme style to "light"', () => {
      applyColorScheme("light");

      expect(document.documentElement.style.colorScheme).toBe("light");
    });

    test('should set colorScheme style to "dark"', () => {
      applyColorScheme("dark");

      expect(document.documentElement.style.colorScheme).toBe("dark");
    });

    test("should remove previous color scheme classes when switching", () => {
      // Start with light
      applyColorScheme("light");
      expect(document.documentElement.classList.contains("light")).toBe(true);

      // Switch to dark
      applyColorScheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
    });

    test('should remove "automatic" class when applying color scheme', () => {
      document.documentElement.classList.add("automatic");

      applyColorScheme("dark");

      expect(document.documentElement.classList.contains("automatic")).toBe(false);
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("suppressTransitions", () => {
    const originalMatchMedia = window.matchMedia;
    const originalRequestAnimationFrame = window.requestAnimationFrame;

    beforeEach(() => {
      // Mock matchMedia to NOT prefer reduced motion
      mockMatchMedia(() => createMockMediaQueryList(false, ""));

      // Mock requestAnimationFrame for cleanup testing
      Object.defineProperty(window, "requestAnimationFrame", {
        value: (callback: FrameRequestCallback) => {
          callback(performance.now());

          return 0;
        },
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, "matchMedia", {
        value: originalMatchMedia,
        writable: true,
      });
      Object.defineProperty(window, "requestAnimationFrame", {
        value: originalRequestAnimationFrame,
        writable: true,
      });

      // Clean up any injected styles
      for (const element of document.querySelectorAll("style")) {
        element.remove();
      }
    });

    test("should inject style tag that suppresses transitions", () => {
      const enable = suppressTransitions();

      const styles = document.querySelectorAll("style");
      const transitionSuppressingStyle = [...styles].find((s) => s.textContent.includes("transition:none"));

      expect(transitionSuppressingStyle).toBeTruthy();

      enable();
    });

    test("should return a cleanup function", () => {
      const enable = suppressTransitions();

      expect(typeof enable).toBe("function");

      enable();
    });

    test("cleanup function should remove the injected style", async () => {
      const enable = suppressTransitions();

      // Verify style exists
      let styles = document.querySelectorAll("style");
      const beforeCount = styles.length;

      expect(beforeCount).toBeGreaterThan(0);

      // Call cleanup
      enable();

      // Use setTimeout to wait for double RAF
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          styles = document.querySelectorAll("style");
          const transitionStyle = [...styles].find((s) => s.textContent.includes("transition:none"));

          expect(transitionStyle).toBeUndefined();
          resolve();
        }, 10);
      });
    });

    test("should set nonce attribute when provided", () => {
      const enable = suppressTransitions("test-nonce");

      const styles = document.querySelectorAll("style");
      const nonceStyle = [...styles].find((s) => s.getAttribute("nonce") === "test-nonce");

      expect(nonceStyle).toBeTruthy();

      enable();
    });

    test("should do nothing when prefers-reduced-motion is enabled", () => {
      mockMatchMedia((query) => createMockMediaQueryList(query === "(prefers-reduced-motion: reduce)", query));

      const styleCountBefore = document.querySelectorAll("style").length;

      const enable = suppressTransitions();

      const styleCountAfter = document.querySelectorAll("style").length;

      // No new style should be added
      expect(styleCountAfter).toBe(styleCountBefore);

      // Cleanup should still work (noop)
      enable();
    });
  });
});
