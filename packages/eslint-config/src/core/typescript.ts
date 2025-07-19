import type { Linter } from "eslint";
import { configs as tseslintConfigs } from "typescript-eslint";
import type { ConfigArray } from "typescript-eslint";

/**
 * Helper function to map typescript-eslint configs with default file patterns
 */
const mapConfigWithFiles = (config: ConfigArray[number]): Linter.Config =>
  ({
    ...(!config.files && config.rules && { files: ["**/*.{ts,tsx}"] }),
    ...config,
  }) as Linter.Config;

export const typescriptRules: Linter.Config[] = [
  // Apply strict type-checked rules
  ...tseslintConfigs.strictTypeChecked.map((config) => mapConfigWithFiles(config)),

  // Apply stylistic type-checked rules
  ...tseslintConfigs.stylisticTypeChecked.map((config) => mapConfigWithFiles(config)),

  // Custom TypeScript configuration
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      // Warning rules
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],

      // Error rules
      // Promise and async handling
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/promise-function-async": "error",

      // Code quality and safety
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/prefer-ts-expect-error": "error",
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",

      // Type imports and exports
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          disallowTypeAnnotations: true,
          fixStyle: "separate-type-imports",
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",

      // Code style and cleanup
      "@typescript-eslint/method-signature-style": ["error", "property"],
      "@typescript-eslint/no-unnecessary-qualifier": "error",
      "@typescript-eslint/no-useless-empty-export": "error",

      // Naming conventions
      "@typescript-eslint/naming-convention": [
        "error",
        // Interfaces should be PascalCase and not prefixed with 'I'
        {
          custom: {
            match: false,
            regex: "^I[A-Z]|^(Interface|Props|State)$",
          },
          format: ["PascalCase"],
          selector: "interface",
        },
        // Type aliases, type parameters, enums, and their members should follow PascalCase
        {
          format: ["PascalCase"],
          selector: ["typeAlias", "typeParameter", "enum", "enumMember"],
        },
      ],
    },
  },
];
