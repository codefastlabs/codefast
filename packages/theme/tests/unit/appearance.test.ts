import { appearances, appearanceSchema } from "#/appearance";

describe("Appearance Schema Validation", () => {
  describe("appearanceSchema", () => {
    test('should accept "light" as valid appearance', () => {
      const result = appearanceSchema.safeParse("light");

      expect(result.success).toBe(true);
      expect(result.data).toBe("light");
    });

    test('should accept "dark" as valid appearance', () => {
      const result = appearanceSchema.safeParse("dark");

      expect(result.success).toBe(true);
      expect(result.data).toBe("dark");
    });

    test('should accept "automatic" as valid appearance', () => {
      const result = appearanceSchema.safeParse("automatic");

      expect(result.success).toBe(true);
      expect(result.data).toBe("automatic");
    });

    test("should reject invalid appearance values", () => {
      expect(appearanceSchema.safeParse("invalid").success).toBe(false);
      expect(appearanceSchema.safeParse("").success).toBe(false);
      // Note: safeParse(undefined) would be useless-undefined, but we want to test null and empty string
      expect(appearanceSchema.safeParse(null).success).toBe(false);
      expect(appearanceSchema.safeParse(123).success).toBe(false);
      expect(appearanceSchema.safeParse({}).success).toBe(false);
    });

    test("should reject similar but incorrect values", () => {
      expect(appearanceSchema.safeParse("Light").success).toBe(false);
      expect(appearanceSchema.safeParse("DARK").success).toBe(false);
      expect(appearanceSchema.safeParse("Automatic").success).toBe(false);
      expect(appearanceSchema.safeParse("system").success).toBe(false);
      expect(appearanceSchema.safeParse(" light").success).toBe(false);
      expect(appearanceSchema.safeParse("dark ").success).toBe(false);
    });
  });

  describe("appearances array", () => {
    test("should contain all valid appearance options", () => {
      expect(appearances).toStrictEqual(["light", "dark", "automatic"]);
    });

    test("should have exactly 3 options", () => {
      expect(appearances).toHaveLength(3);
    });

    test("should include light", () => {
      expect(appearances).toContain("light");
    });

    test("should include dark", () => {
      expect(appearances).toContain("dark");
    });

    test("should include automatic", () => {
      expect(appearances).toContain("automatic");
    });
  });
});
