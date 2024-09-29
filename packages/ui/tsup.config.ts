import { defineConfig } from 'tsup';
import { addUseClientDirective } from '@/add-use-client-directive';

const clientLibs = [
  '@radix-ui/react-context',
  'vaul',
  'cmdk',
  'input-otp',
  'react-resizable-panels',
  '@radix-ui/primitive',
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
