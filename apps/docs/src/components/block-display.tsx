import type { ReactNode } from 'react';

import { unstable_cache as cache } from 'next/cache';

import type { RegistryItemFile } from '@/types/registry';

import { BlockViewer } from '@/components/block-viewer';
import { createFileTreeForRegistryItemFiles, getRegistryItem } from '@/lib/registry';

const getCachedRegistryItem = cache((name: string) => {
  return getRegistryItem(name);
});

const getCachedFileTree = cache((files: RegistryItemFile[]) => {
  return Promise.resolve(createFileTreeForRegistryItemFiles(files));
});

export async function BlockDisplay({ name }: { name: string }): Promise<ReactNode> {
  const item = await getCachedRegistryItem(name);

  if (!item?.files) {
    return null;
  }

  const tree = await getCachedFileTree(item.files);

  return <BlockViewer item={item} tree={tree} />;
}
