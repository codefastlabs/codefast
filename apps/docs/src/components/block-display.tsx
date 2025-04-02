import type { ReactNode } from 'react';

import { cache } from 'react';

import type { RegistryItemFile } from '@/types/registry';

import { BlockViewer } from '@/components/block-viewer';
import { highlightCode } from '@/lib/highlight-code';
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

const getCachedHighlightedFiles = cache(async (files: RegistryItemFile[]) => {
  return await Promise.all(
    files.map(async (file) => ({
      ...file,
      highlightedContent: await highlightCode(file.content ?? ''),
    })),
  );
});

export async function BlockDisplay({ name }: { name: string }): Promise<ReactNode> {
  const item = await getCachedRegistryItem(name);

  if (!item?.files) {
    return null;
  }

  const [tree, highlightedFiles] = await Promise.all([
    getCachedFileTree(item.files),
    getCachedHighlightedFiles(item.files),
  ]);

  const { component: _, ...rest } = item;

  return <BlockViewer highlightedFiles={highlightedFiles} item={rest} tree={tree} />;
}
