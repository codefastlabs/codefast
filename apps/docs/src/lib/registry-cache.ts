import { cache } from "react";

import type { RegistryItem } from "@/types/registry";

import { registryComponents } from "@/app/(app)/components/registry-components";
import { registryBlocks } from "@/registry/registry-blocks";

export const getCachedBlockRegistry = cache((component: string): null | RegistryItem => {
  return registryBlocks[component];
});

export const getCachedComponentsRegistry = cache((component: string): null | RegistryItem => {
  return registryComponents[component];
});
