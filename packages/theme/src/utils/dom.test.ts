import { applyTheme, disableAnimation } from "@/utils/dom";

describe("DOM Utilities", () => {
  describe("applyTheme", () => {
    beforeEach(() => {
      // Reset documentElement classes and styles before each test
      document.documentElement.className = "";
      document.documentElement.style.colorScheme = "";
    });

    test('should add "light" class to html element', () => {
      applyTheme("light");

      expect(document.documentElement.classList.contains("light")).toBe(true);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    test('should add "dark" class to html element', () => {
      applyTheme("dark");

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
    });

    test('should set colorScheme style to "light"', () => {
      applyTheme("light");

      expect(document.documentElement.style.colorScheme).toBe("light");
    });

    test('should set colorScheme style to "dark"', () => {
      applyTheme("dark");

      expect(document.documentElement.style.colorScheme).toBe("dark");
    });

    test("should remove previous theme classes when switching", () => {
      // Start with light theme
      applyTheme("light");
      expect(document.documentElement.classList.contains("light")).toBe(true);

      // Switch to dark theme
      applyTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.documentElement.classList.contains("light")).toBe(false);
    });

    test('should remove "system" class when applying theme', () => {
      document.documentElement.classList.add("system");

      applyTheme("dark");

      expect(document.documentElement.classList.contains("system")).toBe(false);
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("disableAnimation", () => {
    const originalMatchMedia = window.matchMedia;
    const originalRequestAnimationFrame = window.requestAnimationFrame;

    beforeEach(() => {
      // Mock matchMedia to NOT prefer reduced motion
      Object.defineProperty(window, "matchMedia", {
        value: jest.fn().mockImplementation(() => ({
          addEventListener: jest.fn(),
          addListener: jest.fn(),
          dispatchEvent: jest.fn(),
          matches: false, // prefers-reduced-motion: reduce is FALSE
          media: "",
          onchange: null,
          removeEventListener: jest.fn(),
          removeListener: jest.fn(),
        })),
        writable: true,
      });

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
      for (const element of document.querySelectorAll("style")) element.remove();
    });

    test("should inject style tag that disables transitions", () => {
      const enable = disableAnimation();

      const styles = document.querySelectorAll("style");
      const transitionDisablingStyle = [...styles].find((s) =>
        s.textContent.includes("transition:none"),
      );

      expect(transitionDisablingStyle).toBeTruthy();

      enable();
    });

    test("should return a cleanup function", () => {
      const enable = disableAnimation();

      expect(typeof enable).toBe("function");

      enable();
    });

    test("cleanup function should remove the injected style", async () => {
      const enable = disableAnimation();

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
          const transitionStyle = [...styles].find((s) =>
            s.textContent.includes("transition:none"),
          );

          expect(transitionStyle).toBeUndefined();
          resolve();
        }, 10);
      });
    });

    test("should set nonce attribute when provided", () => {
      const enable = disableAnimation("test-nonce");

      const styles = document.querySelectorAll("style");
      const nonceStyle = [...styles].find((s) => s.getAttribute("nonce") === "test-nonce");

      expect(nonceStyle).toBeTruthy();

      enable();
    });

    test("should do nothing when prefers-reduced-motion is enabled", () => {
      Object.defineProperty(window, "matchMedia", {
        value: jest.fn().mockImplementation((query: string) => ({
          addEventListener: jest.fn(),
          addListener: jest.fn(),
          dispatchEvent: jest.fn(),
          matches: query === "(prefers-reduced-motion: reduce)", // prefers-reduced-motion is TRUE
          media: query,
          onchange: null,
          removeEventListener: jest.fn(),
          removeListener: jest.fn(),
        })),
        writable: true,
      });

      const styleCountBefore = document.querySelectorAll("style").length;

      const enable = disableAnimation();

      const styleCountAfter = document.querySelectorAll("style").length;

      // No new style should be added
      expect(styleCountAfter).toBe(styleCountBefore);

      // Cleanup should still work (noop)
      enable();
    });
  });
});
