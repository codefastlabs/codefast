import type { ImageLoaderProps } from 'next/image';

import { DEFAULT_IMAGE_QUALITY } from '@/constants';
import { urlCache } from '@/utils/url-cache';

export function staticLoader({ quality = DEFAULT_IMAGE_QUALITY, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    // Handle relative paths (local images)
    // For relative paths, append query parameters directly to ensure width is included
    const separator = src.includes('?') ? '&' : '?';

    return `${src}${separator}w=${width}&q=${quality}`;
  }

  url.searchParams.set('w', width.toString());
  url.searchParams.set('q', quality.toString());

  return url.toString();
}

