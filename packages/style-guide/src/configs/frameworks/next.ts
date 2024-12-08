// @ts-expect-error: Library does not yet support TypeScript, awaiting update or @types support
import nextPlugin from '@next/eslint-plugin-next';
import { type Linter } from 'eslint';

export const nextConfig: Linter.Config[] = [
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];
