import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import eslintPluginImport from 'eslint-plugin-import';
import { cwd } from 'node:process';
import { configs as tsConfig } from 'typescript-eslint';

import { tsdocConfig } from '@/configs/utils/tsdoc';
import { typescriptRules } from '@/rules/typescript';
import { typescriptExtensionRules } from '@/rules/typescript/extension';
import { typescriptImportRules } from '@/rules/typescript/import';

export const typescriptConfig: Linter.Config[] = [
  ...tsConfig.strictTypeChecked.map((config) =>
    config.name === 'typescript-eslint/strict-type-checked'
      ? {
          files: ['**/*.{ts,tsx,mts,cts}'],
          ...config,
        }
      : config,
  ),
  ...tsConfig.stylisticTypeChecked.map((config) =>
    config.name === 'typescript-eslint/stylistic-type-checked'
      ? {
          files: ['**/*.{ts,tsx,mts,cts}'],
          ...config,
        }
      : config,
  ),
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs', '*.cjs'],
        },
        tsconfigRootDir: cwd(),
      },
    },
    name: '@codefast/style-guide/configs/core/typescript/languages',
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    ...eslintPluginImport.flatConfigs.typescript,
    name: '@codefast/style-guide/configs/core/typescript/import',
    rules: {
      ...eslintPluginImport.flatConfigs.typescript.rules,
      ...typescriptImportRules.rules,
    },
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    ...tsdocConfig,
    name: '@codefast/style-guide/configs/core/typescript/tsdoc',
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    name: '@codefast/style-guide/configs/core/typescript/rules',
    rules: {
      ...typescriptRules.rules,
      ...typescriptExtensionRules.rules,
    },
  },
];
