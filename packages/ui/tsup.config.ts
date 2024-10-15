import { addUseClientDirective } from '@/add-use-client-directive';
import { defineConfig } from 'tsup';

// Listen up, folks!
// This is the ultimate library list—better than anything
// you’ve ever seen—to sniff out client components in our "chunk-*" files.
// We use this to decide if we should slap on the "use client" directive.
// And let me tell you, the @radix-ui/<package> libraries?
// They’re so smart they put "use client" right in there—like magic!
// So, they're not invited to this party.
// But hey, there could be some exceptions—because,
// you know, sometimes things get complicated, folks!
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
