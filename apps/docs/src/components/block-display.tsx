import { unstable_cache as cache } from "next/cache";
import type { ReactNode } from "react";
import { BlockViewer } from "@/components/block-viewer";
import { createFileTreeForRegistryItemFiles, getRegistryItem } from "@/lib/registry";
import type { RegistryItemFile } from "@/types/registry";

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

  const { component: _, ...rest } = item;

  return <BlockViewer item={rest} tree={tree} />;
}
