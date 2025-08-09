import type { Linter, ESLint } from "eslint";

import pluginImport from "eslint-plugin-import-x";

/**
 * Rules that are set to "warn" for import-x plugin
 * These rules are grouped together for better organization and maintainability
 * These rules highlight issues that should be addressed but don't break functionality
 */
const warningImportRules: Linter.RulesRecord = {
  /**
   * Prevents usage of dynamic require()
   * Warning because some cases need dynamic require() but it should be avoided
   */
  "import-x/no-dynamic-require": "warn",

  /**
   * Reports usage of deprecated APIs
   * Warning to encourage updating to newer APIs without breaking builds
   */
  "import-x/no-deprecated": "warn",
};

/**
 * Rules that are disabled (set to "off") for import-x plugin
 * These rules are grouped together for better organization and maintainability
 */
const disabledImportRules: Linter.RulesRecord = {
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
   * Disabled because TypeScript handles this better and it can cause issues
   * with module resolution in monorepos and complex build setups
   */
  "import-x/no-unresolved": "off",

  /**
   * Enforces a specific order for import statements
   * Disabled because we use the perfectionist plugin to handle import ordering
   */
  "import-x/order": "off",

  /**
   * Prevents importing from parent directories beyond a certain depth
   * Disabled because it's too restrictive for monorepo internal structure
   * where cross-directory imports are legitimate and necessary
   */
  "import-x/no-relative-parent-imports": "off",

  /**
   * Detects modules that are imported but never used
   * Disabled by default as it can be expensive to compute
   * Enable in specific projects where unused module detection is needed
   */
  "import-x/no-unused-modules": "off",

  /**
   * Prevents importing from internal/private modules
   * Disabled because it's too restrictive for monorepo structures
   * where internal imports between packages are legitimate
   */
  "import-x/no-internal-modules": "off",
};

/**
 * Rules that are set to "error" for import-x plugin
 * These rules are grouped together for better organization and maintainability
 * These rules catch critical issues that must be fixed
 */
const errorImportRules: Linter.RulesRecord = {
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
   * Enhanced to consider query strings for better duplicate detection
   */
  "import-x/no-duplicates": [
    "error",
    {
      considerQueryString: true,
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
   * Enhanced to prevent importing from index files when importing from directory
   */
  "import-x/no-useless-path-segments": [
    "error",
    {
      commonjs: true,
      noUselessIndex: true,
    },
  ],

  /**
   * Prevents using webpack loader syntax in import statements
   * Example: import foo from 'style-loader!css-loader!foo.css'
   */
  "import-x/no-webpack-loader-syntax": "error",

  /**
   * Ensures consistent use of file extensions in import statements
   * Configured to never require extensions for common JS/TS files
   * but require them for other file types for clarity
   */
  "import-x/extensions": [
    "error",
    "ignorePackages",
    {
      js: "never",
      jsx: "never",
      mjs: "never",
      ts: "never",
      tsx: "never",
    },
  ],

  /**
   * Prevents circular dependencies between modules
   * Critical for avoiding infinite loops and maintaining clean architecture
   * Configured with maxDepth to balance performance and thoroughness
   */
  "import-x/no-cycle": [
    "error",
    {
      ignoreExternal: true,
      maxDepth: 10,
    },
  ],

  /**
   * Ensures consistent style for type imports
   * Enforces using 'import type' for type-only imports in TypeScript
   * Helps with tree-shaking and build optimization
   */
  "import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],

  /**
   * Prevents empty named import blocks
   * Example: import \{\} from 'module' should be avoided
   * Helps keep imports clean and meaningful
   */
  "import-x/no-empty-named-blocks": "error",
};

export const importRules: Linter.Config[] = [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      "import-x": pluginImport as unknown as ESLint.Plugin,
    },
    rules: {
      ...pluginImport.configs["flat/recommended"].rules,
      ...pluginImport.configs["flat/typescript"].rules,

      // Apply all disabled rules
      ...disabledImportRules,

      // Apply all warning rules
      ...warningImportRules,

      // Apply all error rules
      ...errorImportRules,
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
