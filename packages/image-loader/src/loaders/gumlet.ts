import type { ImageLoaderProps } from 'next/image';

import { DEFAULT_IMAGE_QUALITY } from '@/constants';
import { urlCache } from '@/utils/url-cache';

export function gumletLoader({ quality = DEFAULT_IMAGE_QUALITY, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  url.searchParams.set('format', 'auto');
  url.searchParams.set('w', width.toString());
  url.searchParams.set('q', quality.toString());

  return url.toString();
}
