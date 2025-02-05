import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import importPlugin from 'eslint-plugin-import';
import { cwd } from 'node:process';
import { configs as tsConfig } from 'typescript-eslint';

import { tsdocConfig } from '@/configs/utils/tsdoc';
import { TYPESCRIPT_FILES } from '@/lib/constants';
import { typescriptRules } from '@/rules/typescript';
import { typescriptExtensionRules } from '@/rules/typescript/extension';
import { typescriptImportRules } from '@/rules/typescript/import';

export const typescriptConfig: Linter.Config[] = [
  ...tsConfig.strictTypeChecked,
  ...tsConfig.stylisticTypeChecked,
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
    files: TYPESCRIPT_FILES,
    ...importPlugin.flatConfigs.typescript,
    name: '@codefast/style-guide/configs/core/typescript/import',
    rules: {
      ...importPlugin.flatConfigs.typescript.rules,
      ...typescriptImportRules.rules,
    },
  },
  {
    files: TYPESCRIPT_FILES,
    ...tsdocConfig,
    name: '@codefast/style-guide/configs/core/typescript/tsdoc',
  },
  {
    files: TYPESCRIPT_FILES,
    name: '@codefast/style-guide/configs/core/typescript/rules',
    rules: {
      ...typescriptRules.rules,
      ...typescriptExtensionRules.rules,
    },
  },
];
