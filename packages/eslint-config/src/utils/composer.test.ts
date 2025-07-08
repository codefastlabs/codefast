import { describe, expect, it } from "@jest/globals";

import { composeConfig } from "./composer";

import type { Linter } from "eslint";

describe("composeConfig", () => {
  it("should flatten multiple configuration arrays into a single array", () => {
    const config1: Linter.Config[] = [
      { files: ["*.js"], rules: { "no-console": "error" } },
      { files: ["*.ts"], rules: { "@typescript-eslint/no-unused-vars": "error" } },
    ];

    const config2: Linter.Config[] = [{ files: ["*.json"], rules: { "json/no-duplicate-keys": "error" } }];

    const config3: Linter.Config[] = [
      { files: ["*.md"], rules: { "markdown/no-html": "warn" } },
      { ignores: ["dist/**"] },
    ];

    const result = composeConfig(config1, config2, config3);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ files: ["*.js"], rules: { "no-console": "error" } });
    expect(result[1]).toEqual({ files: ["*.ts"], rules: { "@typescript-eslint/no-unused-vars": "error" } });
    expect(result[2]).toEqual({ files: ["*.json"], rules: { "json/no-duplicate-keys": "error" } });
    expect(result[3]).toEqual({ files: ["*.md"], rules: { "markdown/no-html": "warn" } });
    expect(result[4]).toEqual({ ignores: ["dist/**"] });
  });

  it("should handle empty arrays", () => {
    const config1: Linter.Config[] = [];
    const config2: Linter.Config[] = [{ files: ["*.js"], rules: { "no-console": "error" } }];
    const config3: Linter.Config[] = [];

    const result = composeConfig(config1, config2, config3);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ files: ["*.js"], rules: { "no-console": "error" } });
  });

  it("should handle single configuration array", () => {
    const config: Linter.Config[] = [
      { files: ["*.js"], rules: { "no-console": "error" } },
      { files: ["*.ts"], rules: { "@typescript-eslint/no-unused-vars": "error" } },
    ];

    const result = composeConfig(config);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result).toEqual(config);
  });

  it("should handle no arguments", () => {
    const result = composeConfig();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("should preserve configuration object structure", () => {
    const complexConfig: Linter.Config[] = [
      {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: "module",
        },
        plugins: {
          react: {},
        },
        rules: {
          "react/jsx-uses-react": "error",
          "react/jsx-uses-vars": "error",
        },
        settings: {
          react: {
            version: "detect",
          },
        },
      },
    ];

    const result = composeConfig(complexConfig);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(complexConfig[0]);
    expect(result[0].languageOptions).toBeDefined();
    expect(result[0].plugins).toBeDefined();
    expect(result[0].rules).toBeDefined();
    expect(result[0].settings).toBeDefined();
  });

  it("should maintain order of configurations", () => {
    const config1: Linter.Config[] = [{ files: ["*.js"] }];
    const config2: Linter.Config[] = [{ files: ["*.ts"] }];
    const config3: Linter.Config[] = [{ files: ["*.json"] }];

    const result = composeConfig(config1, config2, config3);

    expect(result[0].files).toEqual(["*.js"]);
    expect(result[1].files).toEqual(["*.ts"]);
    expect(result[2].files).toEqual(["*.json"]);
  });
});
