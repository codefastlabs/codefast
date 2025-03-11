import type { JSX, LazyExoticComponent } from 'react';

import { isEmpty } from 'lodash-es';

import type { RegistryItem } from '@/types/registry';

import { Index } from '@/__registry__';
import { registryItemSchema } from '@/types/registry';

const memoizedIndex = Object.fromEntries(Object.entries(Index).map(([name, items]) => [name, { ...items }]));

export function getRegistryComponent(name: string): LazyExoticComponent<() => JSX.Element> | null {
  const item = memoizedIndex[name];

  if (isEmpty(item)) {
    return null;
  }

  return item.component;
}

export function getRegistryItem(name: string): null | RegistryItem {
  const item = memoizedIndex[name];

  if (isEmpty(item)) {
    return null;
  }

  // Fail early before doing expensive file operations.
  const result = registryItemSchema.safeParse(item);

  if (!result.success) {
    return null;
  }

  return result.data;
}
