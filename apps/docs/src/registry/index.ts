import type { Registry } from '@/scripts/lib/schema';

import { blocks } from '@/registry/registry-blocks';
import { charts } from '@/registry/registry-charts';

export const registry = {
  name: '@codefast/ui',
  homepage: 'https://codefast.vercel.app',
  items: [...blocks, ...charts],
} satisfies Registry;
