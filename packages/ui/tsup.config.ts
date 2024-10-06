import { defineConfig } from 'tsup';
import { addUseClientDirective } from '@/add-use-client-directive';

// Array of libraries used to detect client components in chunk files named
// "chunk-*".
// This list is checked to determine if the "use client" directive should be added.
// Notably, the @radix-ui/<package> libraries already include the "use client" directive internally,
// so they are not included here.
// However, there may be exceptions.
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
  entry: ['src/**/*.ts*'],
  format: ['cjs', 'esm'],
  minify: !options.watch,
  plugins: [addUseClientDirective(clientLibs)],
  sourcemap: true,
  shims: true,
  silent: true,
  splitting: true,
  ...options,
}));
