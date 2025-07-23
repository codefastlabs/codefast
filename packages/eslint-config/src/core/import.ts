import type { Linter, ESLint } from "eslint";

import pluginImport from "eslint-plugin-import-x";

export const importRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      "import-x": pluginImport as unknown as ESLint.Plugin,
    },
    rules: {
      ...pluginImport.configs["flat/recommended"].rules,
      ...pluginImport.configs["flat/typescript"].rules,

      /**
       * Ensures all default imports from a module actually exist
       * Disabled because it can cause issues with TypeScript and module bundlers
       */
      "import-x/default": "off",

      /**
       * Ensures all namespace imports from a module actually exist
       * Disabled because this feature is better handled by TypeScript
       */
      "import-x/namespace": "off",

      /**
       * Prevents importing the default export of a module with a named export
       * Disabled because it causes too many false positives and restricts coding freedom
       */
      "import-x/no-named-as-default": "off",

      /**
       * Prevents importing a member of a default export
       * Disabled because it causes too many false positives and restricts coding freedom
       */
      "import-x/no-named-as-default-member": "off",

      /**
       * Ensures all imports can be resolved to a module
       * Disabled because TypeScript handles this better
       */
      "import-x/no-unresolved": "off",

      /**
       * Enforces a specific order for import statements
       * Disabled because we use the perfectionist plugin to handle import ordering
       */
      "import-x/order": "off",

      /**
       * Prevents usage of dynamic require()
       * Warning because some cases need dynamic require() but it should be avoided
       */
      "import-x/no-dynamic-require": "warn",

      /**
       * Reports errors with exports, such as duplicate exports
       */
      "import-x/export": "error",

      /**
       * Ensures all imports appear before any non-import statements
       */
      "import-x/first": "error",

      /**
       * Enforces having a blank line after import statements
       */
      "import-x/newline-after-import": "error",

      /**
       * Prevents imports using absolute paths
       */
      "import-x/no-absolute-path": "error",

      /**
       * Prevents imports using AMD syntax (define)
       */
      "import-x/no-amd": "error",

      /**
       * Prevents duplicate imports from the same module
       */
      "import-x/no-duplicates": [
        "error",
        {
          "prefer-inline": false,
        },
      ],

      /**
       * Prevents imports from packages not listed in dependencies
       * Allows devDependencies in test and config files
       */
      "import-x/no-extraneous-dependencies": [
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

      /**
       * Prevents using import and module.exports in the same file
       * Prevents bundling errors due to inconsistent behavior
       */
      "import-x/no-import-module-exports": "error",

      /**
       * Prevents exporting mutable variables
       * Encourages functional programming and avoids side effects
       */
      "import-x/no-mutable-exports": "error",

      /**
       * Prevents importing the named default member
       * Avoids using import \{default as foo\} from 'foo'
       */
      "import-x/no-named-default": "error",

      /**
       * Prevents importing relative packages (e.g., import '../package')
       * Forces using full package names for clarity
       */
      "import-x/no-relative-packages": "error",

      /**
       * Prevents a module from importing itself
       * Avoids infinite loop errors and confusion
       */
      "import-x/no-self-import": "error",

      /**
       * Prevents unnecessary path segments in import statements
       * Example: import foo from './foo/../bar' should be import foo from './bar'
       */
      "import-x/no-useless-path-segments": [
        "error",
        {
          commonjs: true,
        },
      ],

      /**
       * Prevents using webpack loader syntax in import statements
       * Example: import foo from 'style-loader!css-loader!foo.css'
       */
      "import-x/no-webpack-loader-syntax": "error",
    },

    /**
     * Configuration for eslint-plugin-import-x to correctly handle TypeScript and JavaScript files
     */
    settings: {
      /**
       * Supported file extensions for import rules
       */
      "import-x/extensions": [".js", ".cjs", ".mjs", ".jsx", ".ts", ".tsx"],

      /**
       * Parser configuration to handle different file types
       * Uses TypeScript parser for .ts and .tsx files
       */
      "import-x/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },

      /**
       * Resolver configuration to resolve import paths
       * Uses both Node.js resolver and TypeScript resolver
       */
      "import-x/resolver": {
        node: {
          extensions: [".js", ".cjs", ".mjs", ".jsx", ".ts", ".tsx"],
        },
        typescript: {
          alwaysTryTypes: true,
          // Uses single project reference to avoid performance issues with glob
          project: "./tsconfig.json",
        },
      },
    },
  },
];
