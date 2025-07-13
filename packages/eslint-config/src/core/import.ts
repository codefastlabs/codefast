import type { Linter } from "eslint";
import pluginImport from "eslint-plugin-import";

export const importRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      import: pluginImport,
    },
    rules: {
      ...pluginImport.configs.recommended.rules,
      ...pluginImport.configs.typescript.rules,

      "import/export": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-absolute-path": "error",
      "import/no-amd": "error",
      "import/no-duplicates": "error",
      "import/no-dynamic-require": "warn",
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
      "import/no-import-module-exports": "error",
      "import/no-mutable-exports": "error",
      "import/no-named-default": "error",
      "import/no-relative-packages": "error",
      "import/no-self-import": "error",
      "import/no-useless-path-segments": [
        "error",
        {
          commonjs: true,
        },
      ],
      "import/no-webpack-loader-syntax": "error",

      // Disabled rules
      "import/default": "off",
      "import/dynamic-import-chunkname": "off",
      "import/exports-last": "off",
      // This rule can be slow due to disk checks - TypeScript handles extension checking
      "import/extensions": "off",
      "import/group-exports": "off",
      "import/max-dependencies": "off",
      "import/named": "off",
      "import/namespace": "off",
      "import/no-anonymous-default-export": "off",
      "import/no-commonjs": "off",
      // This rule is slow due to additional parsing - consider running only in CI
      "import/no-cycle": "off",
      "import/no-default-export": "off",
      "import/no-deprecated": "off",
      "import/no-internal-modules": "off",
      // These rules are slow due to additional parsing - consider running only in CI
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
      "import/no-named-export": "off",
      "import/no-namespace": "off",
      "import/no-nodejs-modules": "off",
      "import/no-relative-parent-imports": "off",
      "import/no-restricted-paths": "off",
      "import/no-unassigned-import": "off",
      // These rules duplicate TypeScript checking and can be slow
      "import/no-unresolved": "off",
      "import/no-unused-modules": "off",
      // Disabled in favor of perfectionist/sort-imports for better import sorting
      "import/order": "off",
      "import/prefer-default-export": "off",
      "import/unambiguous": "off",
    },
    settings: {
      "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
        typescript: {
          alwaysTryTypes: true,
          // Use a single project reference to avoid glob performance issues
          project: "./tsconfig.json",
        },
      },
    },
  },
];
