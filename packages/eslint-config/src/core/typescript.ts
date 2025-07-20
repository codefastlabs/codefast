import type { Linter } from "eslint";
import type { ConfigArray } from "typescript-eslint";

import { configs as tseslintConfigs } from "typescript-eslint";

/**
 * Helper function to map typescript-eslint configs with default file patterns.
 *
 * This function ensures that TypeScript ESLint configurations have appropriate
 * file patterns applied when they don't already specify files but have rules defined.
 * It automatically adds TypeScript and TSX file patterns to maintain consistency.
 *
 * @param config - A single configuration object from typescript-eslint ConfigArray
 * @returns A Linter.Config object with file patterns applied if needed
 */
const mapConfigWithFiles = (config: ConfigArray[number]): Linter.Config =>
  ({
    ...(!config.files && config.rules && { files: ["**/*.{ts,tsx}"] }),
    ...config,
  }) as Linter.Config;

/**
 * TypeScript ESLint configuration rules for enhanced type safety and code quality.
 *
 * This configuration combines strict type-checked rules, stylistic rules, and custom
 * TypeScript-specific rules to enforce best practices, improve code quality, and
 * maintain consistency across TypeScript projects.
 *
 * The configuration includes:
 * - Strict type-checked rules from typescript-eslint for maximum type safety
 * - Stylistic type-checked rules for consistent code formatting
 * - Custom rules for promises, imports, naming conventions, and code quality
 *
 * @example
 * ```typescript
 * // ESLint config file
 * import { typescriptRules } from './core/typescript';
 *
 * export default [
 *   ...typescriptRules,
 *   // other configurations
 * ];
 * ```
 */
export const typescriptRules: Linter.Config[] = [
  ...tseslintConfigs.strictTypeChecked.map((config) => mapConfigWithFiles(config)),

  ...tseslintConfigs.stylisticTypeChecked.map((config) => mapConfigWithFiles(config)),

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      // Warning rules - Issues that should be addressed but don't break functionality

      /**
       * Requires explicit return types on functions and class methods.
       * Helps improve code readability and catches potential type issues early.
       * Set to "warn" to encourage good practices without blocking development.
       */
      "@typescript-eslint/explicit-function-return-type": "warn",

      /**
       * Disallows unused variables, parameters, and imports.
       * Helps keep code clean by removing dead code and unused imports.
       * Allows parameters starting with underscore to be unused (common pattern for ignored parameters).
       */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],

      /**
       * Prevents misuse of promises in contexts where they shouldn't be used.
       * Specifically, configured to allow promises in JSX attributes (like onClick handlers)
       * while still catching dangerous promise misuse elsewhere.
       */
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],

      /**
       * Requires functions that return promises to be marked as async.
       * Ensures consistent async function declarations and helps with error handling.
       */
      "@typescript-eslint/promise-function-async": "error",

      /**
       * Requires readonly modifiers for class properties that are never reassigned.
       * Helps prevent accidental mutations and makes code intent clearer.
       */
      "@typescript-eslint/prefer-readonly": "error",

      /**
       * Prefers \@ts-expect-error over \@ts-ignore comments.
       * \@ts-expect-error will cause an error if the expected error doesn't occur,
       * making it safer than \@ts-ignore which silently ignores all errors.
       */
      "@typescript-eslint/prefer-ts-expect-error": "error",

      /**
       * Requires a compare function when calling Array.prototype.sort().
       * Prevents unexpected sorting behavior with numbers and ensures consistent results.
       */
      "@typescript-eslint/require-array-sort-compare": "error",

      /**
       * Ensures switch statements are exhaustive when used with union types.
       * Helps catch missing cases when new values are added to union types.
       */
      "@typescript-eslint/switch-exhaustiveness-check": "error",

      /**
       * Enforces consistent usage of type exports.
       * Ensures that type-only exports use the 'type' keyword for clarity and bundler optimization.
       */
      "@typescript-eslint/consistent-type-exports": "error",

      /**
       * Enforces consistent usage of type imports.
       * Configured to prefer separate type imports (import type \{ ... \}) over inline type imports.
       * This improves bundler tree-shaking and makes type-only imports explicit.
       */
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          disallowTypeAnnotations: true,
          fixStyle: "separate-type-imports",
          prefer: "type-imports",
        },
      ],

      /**
       * Prevents importing types with side effects.
       * Ensures type imports don't accidentally execute code or cause side effects.
       */
      "@typescript-eslint/no-import-type-side-effects": "error",

      /**
       * Enforces using property signature style for methods in interfaces and type literals.
       * Prefers 'method(): void' over 'method: () =\> void' for better readability and consistency.
       */
      "@typescript-eslint/method-signature-style": ["error", "property"],

      /**
       * Disallows unnecessary namespace or enum qualifiers.
       * Removes redundant qualifiers when the context already provides the necessary scope.
       */
      "@typescript-eslint/no-unnecessary-qualifier": "error",

      /**
       * Disallows empty exports that don't change anything in a module.
       * Removes useless 'export \{\}' statements that serve no purpose.
       */
      "@typescript-eslint/no-useless-empty-export": "error",

      /**
       * Restricts the types allowed in template literal expressions.
       * Prevents potentially unsafe type coercion in template literals by only allowing
       * specific types that have predictable string representations.
       * Configured to allow boolean and number types while disallowing potentially
       * problematic types like any, nullish values, and regular expressions.
       */
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowAny: false,
          allowBoolean: true,
          allowNever: false,
          allowNullish: false,
          allowNumber: true,
          allowRegExp: false,
        },
      ],

      /**
       * Enforces consistent naming conventions across TypeScript constructs.
       *
       * This rule is configured with two main patterns:
       * 1. Interface naming: Must use PascalCase and cannot be prefixed with 'I' or use generic names
       * 2. Type constructs: Type aliases, type parameters, enums, and enum members must use PascalCase
       *
       * The interface rule prevents Hungarian notation (IInterface) and overly generic names
       * like 'Interface', 'Props', or 'State' to encourage more descriptive naming.
       */
      "@typescript-eslint/naming-convention": [
        "error",
        {
          custom: {
            match: false,
            regex: "^I[A-Z]|^(Interface|Props|State)$",
          },
          format: ["PascalCase"],
          selector: "interface",
        },
        {
          format: ["PascalCase"],
          selector: ["typeAlias", "typeParameter", "enum", "enumMember"],
        },
      ],
    },
  },
];
