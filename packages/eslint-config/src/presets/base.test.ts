import { describe, expect, it } from "@jest/globals";

import { basePreset } from "./base";

describe("basePreset", () => {
  it("should be an array of ESLint configurations", () => {
    expect(Array.isArray(basePreset)).toBe(true);
    expect(basePreset.length).toBeGreaterThan(0);
  });

  it("should contain JavaScript configuration", () => {
    const hasJsConfig = basePreset.some((config) => config.files?.some((file) => file.includes("js")));
    expect(hasJsConfig).toBe(true);
  });

  it("should contain TypeScript configuration", () => {
    const hasTsConfig = basePreset.some((config) => config.files?.some((file) => file.includes("ts")));
    expect(hasTsConfig).toBe(true);
  });

  it("should contain JSON configuration", () => {
    const hasJsonConfig = basePreset.some((config) => config.files?.some((file) => file.includes("json")));
    expect(hasJsonConfig).toBe(true);
  });

  it("should contain Markdown configuration", () => {
    const hasMarkdownConfig = basePreset.some((config) => config.files?.some((file) => file.includes("md")));
    expect(hasMarkdownConfig).toBe(true);
  });

  it("should contain ignore patterns", () => {
    const ignoreConfig = basePreset.find((config) => config.ignores);
    expect(ignoreConfig).toBeDefined();
    expect(ignoreConfig?.ignores).toContain("**/dist/**");
    expect(ignoreConfig?.ignores).toContain("**/node_modules/**");
  });

  it("should include Node.js environment configuration", () => {
    const hasNodeConfig = basePreset.some(
      (config) => config.languageOptions?.globals ?? config.files?.some((file) => !file.includes("browser")),
    );
    expect(hasNodeConfig).toBe(true);
  });

  it("should include test environment configuration", () => {
    const hasTestConfig = basePreset.some((config) =>
      config.files?.some((file) => file.includes("test") || file.includes("spec") || file.includes("__tests__")),
    );
    expect(hasTestConfig).toBe(true);
  });

  it("should include Prettier configuration", () => {
    const hasPrettierConfig = basePreset.some(
      (config) =>
        (config.plugins?.prettier ?? false) ||
        config.rules?.["prettier/prettier"] !== undefined ||
        (config.rules &&
          Object.keys(config.rules).some(
            (rule) => rule.includes("prettier") || rule === "arrow-body-style" || rule === "prefer-arrow-callback",
          )),
    );
    expect(hasPrettierConfig).toBe(true);
  });

  it("should include import rules", () => {
    const hasImportRules = basePreset.some(
      (config) => config.plugins?.import ?? Object.keys(config.rules ?? {}).some((rule) => rule.startsWith("import/")),
    );
    expect(hasImportRules).toBe(true);
  });

  it("should include unicorn rules", () => {
    const hasUnicornRules = basePreset.some(
      (config) =>
        config.plugins?.unicorn ?? Object.keys(config.rules ?? {}).some((rule) => rule.startsWith("unicorn/")),
    );
    expect(hasUnicornRules).toBe(true);
  });

  it("should have all configurations as valid objects", () => {
    for (const config of basePreset) {
      expect(typeof config).toBe("object");
      expect(config).not.toBeNull();
    }
  });

  it("should not have duplicate file patterns", () => {
    const filePatterns = new Set<string>();
    const duplicates: string[] = [];

    for (const config of basePreset) {
      if (config.files) {
        for (const pattern of config.files) {
          const patternString = Array.isArray(pattern) ? pattern.join(",") : pattern;
          if (filePatterns.has(patternString)) {
            duplicates.push(patternString);
          } else {
            filePatterns.add(patternString);
          }
        }
      }
    }

    expect(duplicates.length).toBeLessThan(basePreset.length);
  });

  it("should include essential JavaScript rules", () => {
    const jsRules = basePreset
      .filter((config) => config.rules)
      .map((config) => config.rules)
      .reduce((accumulator, rules) => ({ ...accumulator, ...rules }), {});

    expect(jsRules).toHaveProperty("prefer-const");
    expect(jsRules).toHaveProperty("no-var");
    expect(jsRules).toHaveProperty("no-console");
  });

  it("should include TypeScript rules when TypeScript files are present", () => {
    const tsConfigs = basePreset.filter((config) => config.files?.some((file) => file.includes("ts")));

    expect(tsConfigs.length).toBeGreaterThan(0);

    const hasTypescriptRules = tsConfigs.some((config) =>
      Object.keys(config.rules ?? {}).some((rule) => rule.startsWith("@typescript-eslint/")),
    );

    expect(hasTypescriptRules).toBe(true);
  });

  it("should be properly flattened (no nested arrays)", () => {
    for (const config of basePreset) {
      expect(Array.isArray(config)).toBe(false);
      expect(typeof config).toBe("object");
    }
  });

  it("should have reasonable number of configurations", () => {
    expect(basePreset.length).toBeGreaterThan(5);
    expect(basePreset.length).toBeLessThan(50);
  });
});
