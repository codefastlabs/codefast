import type { Linter } from 'eslint';

import { nodeEnvironment } from '@/environments/node';
import { nextRules } from '@/plugins/frameworks/next';
import { prettierRules } from '@/plugins/tooling/prettier';
import { reactPresetCore } from '@/presets/react';
import { composeConfig } from '@/utils/compose-config';

export const nextPreset: Linter.Config[] = composeConfig(
  [
    // Ignore Next.js generated files
    {
      ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
      name: '@codefast/eslint-config/presets/next/ignores',
    },
  ],
  reactPresetCore,
  nextRules,

  nodeEnvironment,

  prettierRules,
);
