import { describe, expect, it } from "@jest/globals";

import { composeConfig } from "@/utils/composer";

import type { Linter } from "eslint";

describe("composeConfig", () => {
  it("should flatten multiple config arrays into a single array", () => {
    const config1: Linter.Config[] = [
      { name: "config1-rule1", rules: { "no-console": "error" } },
      { name: "config1-rule2", rules: { "no-debugger": "error" } },
    ];

    const config2: Linter.Config[] = [{ name: "config2-rule1", rules: { "prefer-const": "error" } }];

    const config3: Linter.Config[] = [
      { name: "config3-rule1", rules: { "no-unused-vars": "error" } },
      { name: "config3-rule2", rules: { "no-undef": "error" } },
    ];

    const result = composeConfig(config1, config2, config3);

    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ name: "config1-rule1", rules: { "no-console": "error" } });
    expect(result[1]).toEqual({ name: "config1-rule2", rules: { "no-debugger": "error" } });
    expect(result[2]).toEqual({ name: "config2-rule1", rules: { "prefer-const": "error" } });
    expect(result[3]).toEqual({ name: "config3-rule1", rules: { "no-unused-vars": "error" } });
    expect(result[4]).toEqual({ name: "config3-rule2", rules: { "no-undef": "error" } });
  });

  it("should handle empty arrays", () => {
    const result = composeConfig([], []);
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it("should handle single config array", () => {
    const config: Linter.Config[] = [{ name: "single-config", rules: { "no-console": "error" } }];

    const result = composeConfig(config);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: "single-config", rules: { "no-console": "error" } });
  });

  it("should handle mixed empty and non-empty arrays", () => {
    const config1: Linter.Config[] = [];
    const config2: Linter.Config[] = [{ name: "config2-rule1", rules: { "prefer-const": "error" } }];
    const config3: Linter.Config[] = [];

    const result = composeConfig(config1, config2, config3);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: "config2-rule1", rules: { "prefer-const": "error" } });
  });
});
