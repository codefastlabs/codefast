import type { ReactNode } from 'react';

import { cache } from 'react';

import type { RegistryItemFile } from '@/types/registry';

import { BlockViewer } from '@/components/block-viewer';
import { createFileTreeForRegistryItemFiles, getRegistryItem } from '@/lib/registry';

const getCachedRegistryItem = cache(async (name: string) => {
  return await getRegistryItem(name);
});

const getCachedFileTree = cache((files?: RegistryItemFile[]) => {
  if (!files) {
    return null;
  }

  return createFileTreeForRegistryItemFiles(files);
});

export async function BlockDisplay({ name }: { name: string }): Promise<ReactNode> {
  const item = await getCachedRegistryItem(name);

  if (!item?.files) {
    return null;
  }

  const tree = getCachedFileTree(item.files);

  const { component: _, ...rest } = item;

  return <BlockViewer item={rest} tree={tree} />;
}
