import type { ImageLoaderProps } from 'next/image';
import type { LoaderFunction } from '@codefast/image-loader';
import { createCustomImageLoader, DEFAULT_IMAGE_QUALITY, isDomainMatch } from '@codefast/image-loader';
import { urlCache } from '@codefast/image-loader/utils/url-cache';

/**
 * Loader for avatar.vercel.sh
 * Adds width and quality parameters to optimize avatar images
 */
const avatarVercelLoader: LoaderFunction = ({
  quality = DEFAULT_IMAGE_QUALITY,
  src,
  width,
}: ImageLoaderProps): string => {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  url.searchParams.set('w', width.toString());
  url.searchParams.set('q', quality.toString());

  return url.toString();
};

// Create custom image loader with avatar.vercel.sh loader
// Built-in loaders are automatically included by createCustomImageLoader
const customImageLoader = createCustomImageLoader({
  loaders: [
    {
      loader: avatarVercelLoader,
      matcher: (src): boolean => isDomainMatch(src, 'avatar.vercel.sh'),
    },
  ],
});

export default customImageLoader;
