import { defineConfig } from 'tsup';

import { addUseClientDirective } from '@/add-use-client-directive';

/**
 * This list is crucial for identifying client components within "chunk-*" files.
 * It determines where to apply the "use client" directive.
 * The \@radix-ui/<package> libraries inherently handle this directive; hence, they are excluded from this list.
 * Exceptions are possible due to specific complex scenarios where default handling may not suffice.
 */
const clientLibs = [
  '@radix-ui/react-use-controllable-state',
  '@radix-ui/react-context',
  '@radix-ui/primitive',
  'react-resizable-panels',
  'input-otp',
  'cmdk',
  'vaul',
];

export default defineConfig((options) => ({
  clean: !options.watch,
  dts: true,
  entry: ['src/**/*.ts*', '!src/**/*.test.ts*'],
  format: ['cjs', 'esm'],
  minify: !options.watch,
  plugins: [addUseClientDirective(clientLibs)],
  sourcemap: true,
  splitting: true,
  silent: true,
  ...options,
}));
