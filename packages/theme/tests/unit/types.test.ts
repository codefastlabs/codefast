import { colorSchemes, colorSchemeSchema } from "#/types";

describe("Color Scheme Schema Validation", () => {
  describe("colorSchemeSchema", () => {
    test('should accept "light" as valid color scheme', () => {
      const result = colorSchemeSchema.safeParse("light");

      expect(result.success).toBe(true);
      expect(result.data).toBe("light");
    });

    test('should accept "dark" as valid color scheme', () => {
      const result = colorSchemeSchema.safeParse("dark");

      expect(result.success).toBe(true);
      expect(result.data).toBe("dark");
    });

    test('should accept "automatic" as valid color scheme', () => {
      const result = colorSchemeSchema.safeParse("automatic");

      expect(result.success).toBe(true);
      expect(result.data).toBe("automatic");
    });

    test("should reject invalid color scheme values", () => {
      expect(colorSchemeSchema.safeParse("invalid").success).toBe(false);
      expect(colorSchemeSchema.safeParse("").success).toBe(false);
      // Note: safeParse(undefined) would be useless-undefined, but we want to test null and empty string
      expect(colorSchemeSchema.safeParse(null).success).toBe(false);
      expect(colorSchemeSchema.safeParse(123).success).toBe(false);
      expect(colorSchemeSchema.safeParse({}).success).toBe(false);
    });

    test("should reject similar but incorrect values", () => {
      expect(colorSchemeSchema.safeParse("Light").success).toBe(false);
      expect(colorSchemeSchema.safeParse("DARK").success).toBe(false);
      expect(colorSchemeSchema.safeParse("Automatic").success).toBe(false);
      expect(colorSchemeSchema.safeParse("system").success).toBe(false);
      expect(colorSchemeSchema.safeParse(" light").success).toBe(false);
      expect(colorSchemeSchema.safeParse("dark ").success).toBe(false);
    });
  });

  describe("colorSchemes array", () => {
    test("should contain all valid color scheme options", () => {
      expect(colorSchemes).toStrictEqual(["light", "dark", "automatic"]);
    });

    test("should have exactly 3 options", () => {
      expect(colorSchemes).toHaveLength(3);
    });

    test("should include light", () => {
      expect(colorSchemes).toContain("light");
    });

    test("should include dark", () => {
      expect(colorSchemes).toContain("dark");
    });

    test("should include automatic", () => {
      expect(colorSchemes).toContain("automatic");
    });
  });
});
