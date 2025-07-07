import pluginImport from "eslint-plugin-import";

import type { Linter } from "eslint";

// Import rules - better import management
export const importRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      import: pluginImport,
    },
    rules: {
      ...pluginImport.configs.recommended.rules,
      ...pluginImport.configs.typescript.rules,
      // Static analysis
      "import/no-unresolved": "error",
      "import/named": "error",
      "import/default": "error",
      "import/namespace": "error",
      "import/no-restricted-paths": "off",
      "import/no-absolute-path": "error",
      "import/no-dynamic-require": "warn",
      "import/no-internal-modules": "off",
      "import/no-webpack-loader-syntax": "error",
      "import/no-self-import": "error",
      "import/no-cycle": ["error", { maxDepth: 10 }],
      "import/no-useless-path-segments": ["error", { commonjs: true }],
      "import/no-relative-parent-imports": "off",
      "import/no-relative-packages": "error",

      // Helpful warnings
      "import/export": "error",
      "import/no-named-as-default": "warn",
      "import/no-named-as-default-member": "warn",
      "import/no-deprecated": "warn",
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/__tests__/**",
            "**/__mocks__/**",
            "**/*.test.{ts,tsx,js,jsx}",
            "**/*.spec.{ts,tsx,js,jsx}",
            "**/*.e2e.{ts,tsx,js,jsx}",
            "**/*.setup.{ts,js}",
            "**/*.config.{ts,js,cjs,mjs}",
            "**/jest.setup.{ts,js}",
            "**/vitest.setup.{ts,js}",
            "**/cypress/**",
            "**/playwright/**",
            "**/test/**",
            "**/tests/**",
            "**/*.stories.{ts,tsx}",
            "**/*.story.{ts,tsx}",
            "**/*.mdx",
            "scripts/**",
            "config/**",
            "**/.*rc.{js,cjs}",
            "**/.*.{config.js,cjs}",
            "**/*.{config.js,cjs,mjs,ts}",
          ],
        },
      ],
      "import/no-mutable-exports": "error",
      "import/no-unused-modules": "off", // Can be performance intensive

      // Module systems
      "import/unambiguous": "off",
      "import/no-commonjs": "off",
      "import/no-amd": "error",
      "import/no-nodejs-modules": "off",
      "import/no-import-module-exports": "error",

      // Style guide
      "import/first": "error",
      "import/exports-last": "off",
      "import/no-duplicates": "error",
      "import/no-namespace": "off",
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          js: "never",
          mjs: "never",
          jsx: "never",
          ts: "never",
          tsx: "never",
        },
      ],
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object", "type"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import/newline-after-import": "error",
      "import/prefer-default-export": "off",
      "import/max-dependencies": "off",
      "import/no-unassigned-import": "off",
      "import/no-named-default": "error",
      "import/no-default-export": "off",
      "import/no-named-export": "off",
      "import/no-anonymous-default-export": "off",
      "import/group-exports": "off",
      "import/dynamic-import-chunkname": "off",
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: ["./tsconfig.json", "./packages/*/tsconfig.json"],
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
      "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
    },
  },
];
