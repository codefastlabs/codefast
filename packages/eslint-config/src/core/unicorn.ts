import pluginUnicorn from "eslint-plugin-unicorn";

import type { Linter } from "eslint";

// Unicorn rules - promote modern best practices
export const unicornRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      unicorn: pluginUnicorn,
    },
    rules: {
      ...pluginUnicorn.configs.recommended.rules,
      // Customize some rules for a better developer experience
      "unicorn/filename-case": [
        "error",
        {
          cases: {
            kebabCase: true,
            camelCase: true,
            pascalCase: true,
          },
        },
      ],
      "unicorn/no-array-reduce": "off",
      "unicorn/no-null": "off",
      "unicorn/no-process-exit": "off",
      "unicorn/prefer-array-flat-map": "error",
      "unicorn/prefer-array-some": "error",
      "unicorn/prefer-date-now": "error",
      "unicorn/prefer-default-parameters": "error",
      "unicorn/prefer-includes": "error",
      "unicorn/prefer-math-trunc": "error",
      "unicorn/prefer-modern-math-apis": "error",
      "unicorn/prefer-module": "off",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-number-properties": "error",
      "unicorn/prefer-optional-catch-binding": "error",
      "unicorn/prefer-string-slice": "error",
      "unicorn/prefer-string-starts-ends-with": "error",
      "unicorn/prefer-string-trim-start-end": "error",
      "unicorn/prefer-ternary": "error",
      "unicorn/prefer-top-level-await": "off",
      "unicorn/prevent-abbreviations": [
        "error",
        {
          replacements: {
            props: false,
            ref: false,
            params: false,
            args: false,
            env: false,
            dev: false,
            prod: false,
            temp: false,
            tmp: false,
          },
          allowList: {
            utils: false,
          },
        },
      ],
      "unicorn/throw-new-error": "error",
    },
  },
];
