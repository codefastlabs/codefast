import type { Registry } from '@/types/registry';

import { blocks } from '@/registry/registry-blocks';
import { charts } from '@/registry/registry-charts';
import { ui } from '@/registry/registry-demo';

export const registry = {
  name: '@codefast/ui',
  homepage: 'https://codefastlabs.vercel.app/',
  items: [...ui, ...blocks, ...charts],
} satisfies Registry;
