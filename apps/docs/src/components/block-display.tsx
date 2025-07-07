import { unstable_cache as cache } from "next/cache";

import type { RegistryItemFile } from "@/types/registry";
import type { ReactNode } from "react";

import { BlockViewer } from "@/components/block-viewer";
import { createFileTreeForRegistryItemFiles, getRegistryItem } from "@/lib/registry";


const getCachedRegistryItem = cache(async (name: string) => {
  return getRegistryItem(name);
});

const getCachedFileTree = cache(async (files: RegistryItemFile[]) => {
  return createFileTreeForRegistryItemFiles(files);
});

export async function BlockDisplay({ name }: { name: string }): Promise<ReactNode> {
  const item = await getCachedRegistryItem(name);

  if (!item?.files) {
    return null;
  }

  const tree = await getCachedFileTree(item.files);

  const { component: _, ...rest } = item;

  return <BlockViewer item={rest} tree={tree} />;
}
