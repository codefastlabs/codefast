import { appearances, isAppearance } from "#appearance";

describe("Appearance Values", () => {
  describe("appearances array", () => {
    test("should contain all valid appearance options", () => {
      expect(appearances).toStrictEqual(["light", "dark", "automatic"]);
    });

    test("should have exactly 3 options", () => {
      expect(appearances).toHaveLength(3);
    });
  });

  describe("isAppearance", () => {
    test("should accept every appearance value", () => {
      for (const value of appearances) {
        expect(isAppearance(value)).toBe(true);
      }
    });

    test("should reject invalid appearance values", () => {
      expect(isAppearance("invalid")).toBe(false);
      expect(isAppearance("")).toBe(false);
      expect(isAppearance(null)).toBe(false);
      expect(isAppearance(undefined)).toBe(false);
      expect(isAppearance(123)).toBe(false);
      expect(isAppearance({})).toBe(false);
      expect(isAppearance(["light"])).toBe(false);
    });

    test("should reject similar but incorrect values", () => {
      expect(isAppearance("Light")).toBe(false);
      expect(isAppearance("DARK")).toBe(false);
      expect(isAppearance("Automatic")).toBe(false);
      expect(isAppearance("system")).toBe(false);
      expect(isAppearance(" light")).toBe(false);
      expect(isAppearance("dark ")).toBe(false);
    });
  });
});
