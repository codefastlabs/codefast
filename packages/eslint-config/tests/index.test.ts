import { describe, expect, test } from "@jest/globals";

import { testEnvironment } from "@/environments/test";

describe("ESLint Config Package", () => {
  test("should be able to run TypeScript tests with Jest and @swc/jest", () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });

  test("should support ES modules syntax", () => {
    const testObject = { name: "test", value: 42 };
    expect(testObject).toEqual({ name: "test", value: 42 });
  });

  test("should export testEnvironment with correct structure", () => {
    expect(testEnvironment).toBeDefined();
    expect(Array.isArray(testEnvironment)).toBe(true);
    expect(testEnvironment.length).toBeGreaterThan(0);

    const config = testEnvironment.at(0);
    expect(config).toHaveProperty("files");
    expect(config).toHaveProperty("languageOptions");
    expect(config?.languageOptions).toHaveProperty("globals");

    // Check that test-specific globals are included
    const globals = config?.languageOptions?.globals;
    expect(globals).toHaveProperty("describe");
    expect(globals).toHaveProperty("test");
    expect(globals).toHaveProperty("expect");
    expect(globals).toHaveProperty("jest");
  });
});
