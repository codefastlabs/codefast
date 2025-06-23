import { cache } from "react";
import { registryComponents } from "@/app/(app)/components/registry-components";
import { registryBlocks } from "@/registry/registry-blocks";
import type { RegistryItem } from "@/types/registry";

export const getCachedBlockRegistry = cache((component: string): null | RegistryItem => {
  return registryBlocks[component];
});

export const getCachedComponentsRegistry = cache((component: string): null | RegistryItem => {
  return registryComponents[component];
});
