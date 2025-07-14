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

      // Disabled rules
      "import/default": "off",
      "import/namespace": "off",
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
      "import/no-unresolved": "off",

      // Warning rules
      "import/no-dynamic-require": "warn",

      // Error rules
      "import/export": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-absolute-path": "error",
      "import/no-amd": "error",
      "import/no-duplicates": "error",
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/__tests__/**",
            "**/*.test.*",
            "**/*.spec.*",
            "**/*.e2e.*",
            "**/*.setup.{js,mjs,cjs,ts}",
            "**/*.config.{js,mjs,cjs,ts}",
            "**/jest.setup.{js,mjs,cjs,ts}",
            "**/vitest.setup.{js,mjs,cjs,ts}",
            "**/cypress/**",
            "**/playwright/**",
            "**/test/**",
            "**/tests/**",
            "**/*.stories.{ts,tsx}",
            "**/*.story.{ts,tsx}",
            "**/*.mdx",
            "scripts/**",
            "config/**",
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
    },
    settings: {
      "import/extensions": [".js", ".cjs", ".mjs", ".jsx", ".ts", ".tsx"],
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".cjs", ".mjs", ".jsx", ".ts", ".tsx"],
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
