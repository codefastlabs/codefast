import { describe, expect, it } from "@jest/globals";

import { baseJavaScriptRules } from "./javascript";

describe("baseJavaScriptRules", () => {
  it("should be an array of ESLint configurations", () => {
    expect(Array.isArray(baseJavaScriptRules)).toBe(true);
    expect(baseJavaScriptRules.length).toBeGreaterThan(0);
  });

  it("should have ignore patterns configuration", () => {
    const ignoreConfig = baseJavaScriptRules.find((config) => config.ignores);
    expect(ignoreConfig).toBeDefined();
    expect(ignoreConfig?.ignores).toContain("**/dist/**");
    expect(ignoreConfig?.ignores).toContain("**/build/**");
    expect(ignoreConfig?.ignores).toContain("**/node_modules/**");
    expect(ignoreConfig?.ignores).toContain("**/coverage/**");
  });

  it("should have JavaScript file patterns", () => {
    const jsConfig = baseJavaScriptRules.find((config) => config.files);
    expect(jsConfig).toBeDefined();
    expect(jsConfig?.files).toContain("**/*.{js,mjs,cjs}");
  });

  it("should include essential modern JavaScript rules", () => {
    const jsConfig = baseJavaScriptRules.find((config) => config.rules);
    expect(jsConfig).toBeDefined();
    expect(jsConfig?.rules).toBeDefined();

    const rules = jsConfig?.rules;

    // Modern JavaScript practices
    expect(rules?.["prefer-const"]).toBe("error");
    expect(rules?.["no-var"]).toBe("error");
    expect(rules?.["prefer-arrow-callback"]).toBe("error");
    expect(rules?.["prefer-template"]).toBe("error");
    expect(rules?.["object-shorthand"]).toBe("error");

    // Code quality
    expect(rules?.["no-console"]).toBe("warn");
    expect(rules?.["no-debugger"]).toBe("error");
    expect(rules?.["no-alert"]).toBe("error");
    expect(rules?.["consistent-return"]).toBe("error");
    expect(rules?.["eqeqeq"]).toEqual(["error", "always"]);

    // Best practices
    expect(rules?.["no-duplicate-imports"]).toBe("error");
    expect(rules?.["no-useless-concat"]).toBe("error");
    expect(rules?.["no-useless-return"]).toBe("error");
    expect(rules?.["no-nested-ternary"]).toBe("error");
  });

  it("should have proper destructuring configuration", () => {
    const jsConfig = baseJavaScriptRules.find((config) => config.rules);
    const destructuringRule = jsConfig?.rules?.["prefer-destructuring"];

    expect(destructuringRule).toEqual(["error", { object: true, array: false }]);
  });

  it("should have proper unused vars configuration", () => {
    const jsConfig = baseJavaScriptRules.find((config) => config.rules);
    const unusedVariablesRule = jsConfig?.rules?.["no-unused-vars"];

    expect(unusedVariablesRule).toEqual(["warn", { argsIgnorePattern: "^_" }]);
  });

  it("should have proper magic numbers configuration", () => {
    const jsConfig = baseJavaScriptRules.find((config) => config.rules);
    const magicNumbersRule = jsConfig?.rules?.["no-magic-numbers"];

    expect(magicNumbersRule).toEqual(["warn", { ignore: [0, 1, -1] }]);
  });

  it("should include plugins configuration", () => {
    const jsConfig = baseJavaScriptRules.find((config) => config.plugins);
    expect(jsConfig).toBeDefined();
    expect(jsConfig?.plugins).toBeDefined();
    expect(jsConfig?.plugins?.js).toBeDefined();
  });

  it("should extend recommended JavaScript rules", () => {
    const jsConfig = baseJavaScriptRules.find((config) => config.rules);
    expect(jsConfig?.rules).toBeDefined();

    // These are some common rules from @eslint/js recommended
    const rules = jsConfig?.rules;
    expect(rules).toHaveProperty("no-undef");
    expect(rules).toHaveProperty("no-unused-vars");
  });

  it("should have all configurations as objects", () => {
    for (const config of baseJavaScriptRules) {
      expect(typeof config).toBe("object");
      expect(config).not.toBeNull();
    }
  });

  it("should not have conflicting file patterns", () => {
    const fileConfigs = baseJavaScriptRules.filter((config) => config.files);

    // Should have exactly one file configuration for JS files
    expect(fileConfigs.length).toBe(1);
    expect(fileConfigs[0].files).toEqual(["**/*.{js,mjs,cjs}"]);
  });
});
