import type { ImageLoaderProps } from 'next/image';

import type { LoaderConfig, LoaderFunction } from '@/types';

import { createImageLoader } from '@/core/image-loader';
import { builtInLoaderConfigs } from '@/core/loader-registry';

const defaultImageLoader = createImageLoader(builtInLoaderConfigs);

export function imageLoader(params: ImageLoaderProps): string {
  return defaultImageLoader.transform(params);
}

export function createCustomImageLoader(config: {
  loaders?: LoaderConfig[];
  fallbackLoader?: LoaderFunction;
}): (params: ImageLoaderProps) => string {
  const loader = createImageLoader(config.loaders, config.fallbackLoader);

  return (params: ImageLoaderProps) => loader.transform(params);
}
