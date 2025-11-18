import type { ImageLoaderProps } from 'next/image';

import { DEFAULT_IMAGE_QUALITY } from '@/constants';
import { urlCache } from '@/utils/url-cache';

export function imagekitLoader({ quality = DEFAULT_IMAGE_QUALITY, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  const params = [`w-${width}`, `q-${quality}`];

  url.searchParams.set('tr', params.join(','));

  return url.toString();
}
