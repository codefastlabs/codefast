import type { Linter } from "eslint";
import { configs as tseslintConfigs } from "typescript-eslint";
import type { ConfigArray } from "typescript-eslint";

/**
 * TypeScript file patterns
 */
const TYPESCRIPT_FILES = ["**/*.{ts,mts,cts,tsx}"];

/**
 * Helper function to map typescript-eslint configs with default file patterns
 */
const mapConfigWithFiles = (config: ConfigArray[number]): Linter.Config =>
  ({
    ...(!config.files && config.rules && { files: TYPESCRIPT_FILES }),
    ...config,
  }) as Linter.Config;

/**
 * Custom TypeScript rules configuration
 */
const customTypescriptRules: Linter.RulesRecord = {
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

  // Variable and import handling
  "@typescript-eslint/no-unused-vars": [
    "warn",
    {
      argsIgnorePattern: "^_",
    },
  ],

  "@typescript-eslint/consistent-type-exports": "error",
  // Type imports and exports
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      prefer: "type-imports",
    },
  ],
  "@typescript-eslint/no-import-type-side-effects": "error",

  // Code style and cleanup
  "@typescript-eslint/method-signature-style": ["error", "property"],
  "@typescript-eslint/no-unnecessary-qualifier": "error",
  "@typescript-eslint/no-useless-empty-export": "error",

  // Disabled rules
  "@typescript-eslint/explicit-function-return-type": "off",
};

export const typescriptRules: Linter.Config[] = [
  // Apply strict type-checked rules
  ...tseslintConfigs.strictTypeChecked.map((config) => mapConfigWithFiles(config)),

  // Apply stylistic type-checked rules
  ...tseslintConfigs.stylisticTypeChecked.map((config) => mapConfigWithFiles(config)),

  // Custom TypeScript configuration
  {
    files: TYPESCRIPT_FILES,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: customTypescriptRules,
  },
];
