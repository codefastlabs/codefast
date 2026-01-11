import { themes, themeSchema } from '@/types';

describe('Theme Schema Validation', () => {
  describe('themeSchema', () => {
    test('should accept "light" as valid theme', () => {
      const result = themeSchema.safeParse('light');

      expect(result.success).toBe(true);
      expect(result.data).toBe('light');
    });

    test('should accept "dark" as valid theme', () => {
      const result = themeSchema.safeParse('dark');

      expect(result.success).toBe(true);
      expect(result.data).toBe('dark');
    });

    test('should accept "system" as valid theme', () => {
      const result = themeSchema.safeParse('system');

      expect(result.success).toBe(true);
      expect(result.data).toBe('system');
    });

    test('should reject invalid theme values', () => {
      expect(themeSchema.safeParse('invalid').success).toBe(false);
      expect(themeSchema.safeParse('').success).toBe(false);
      // Note: safeParse(undefined) would be useless-undefined, but we want to test null and empty string
      expect(themeSchema.safeParse(null).success).toBe(false);
      expect(themeSchema.safeParse(123).success).toBe(false);
      expect(themeSchema.safeParse({}).success).toBe(false);
    });

    test('should reject similar but incorrect values', () => {
      expect(themeSchema.safeParse('Light').success).toBe(false);
      expect(themeSchema.safeParse('DARK').success).toBe(false);
      expect(themeSchema.safeParse('System').success).toBe(false);
      expect(themeSchema.safeParse(' light').success).toBe(false);
      expect(themeSchema.safeParse('dark ').success).toBe(false);
    });
  });

  describe('themes array', () => {
    test('should contain all valid theme options', () => {
      expect(themes).toStrictEqual(['light', 'dark', 'system']);
    });

    test('should have exactly 3 options', () => {
      expect(themes).toHaveLength(3);
    });

    test('should include light', () => {
      expect(themes).toContain('light');
    });

    test('should include dark', () => {
      expect(themes).toContain('dark');
    });

    test('should include system', () => {
      expect(themes).toContain('system');
    });
  });
});
