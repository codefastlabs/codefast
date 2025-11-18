import type { ImageLoaderProps } from 'next/image';

import type { LoaderConfig, LoaderFunction } from '@/types';

export class ImageLoader {
  private readonly loaders: LoaderConfig[] = [];
  private readonly fallbackLoader?: LoaderFunction;

  constructor(config: LoaderConfig[] = [], fallbackLoader?: LoaderFunction) {
    this.loaders = config;
    this.fallbackLoader = fallbackLoader;
  }

  transform(params: ImageLoaderProps): string {
    const { src } = params;

    try {
      for (const { loader, matcher } of this.loaders) {
        if (matcher(src)) {
          return loader(params);
        }
      }

      if (this.fallbackLoader) {
        return this.fallbackLoader(params);
      }

      return src;
    } catch {
      return src;
    }
  }
}

export function createImageLoader(config: LoaderConfig[] = [], fallbackLoader?: LoaderFunction): ImageLoader {
  return new ImageLoader(config, fallbackLoader);
}
