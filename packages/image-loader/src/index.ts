import type { ImageLoaderProps } from "next/image";

import type { LoaderConfig, LoaderFunction } from "@/core/types";

import { createImageLoader } from "@/core/image-loader";
import { defaultLoaderConfigs } from "@/core/loader-registry";

// Export individual loaders for advanced usage
export {
  cloudflareLoader,
  cloudfrontLoader,
  cloudinaryLoader,
  contentfulLoader,
  fastlyLoader,
  gumletLoader,
  imageengineLoader,
  imagekitLoader,
  imgixLoader,
  pixelbinLoader,
  sanityLoader,
  sirvLoader,
  supabaseLoader,
  thumborLoader,
  unsplashLoader,
} from "@/loaders";

export { createImageLoader, ImageLoader } from "@/core/image-loader";
export { createLoaderRegistry, defaultLoaderConfigs } from "@/core/loader-registry";
// Export core types and utilities
export type { ImageLoaderOptions, LoaderConfig, LoaderFunction } from "@/core/types";

/**
 * Default image loader instance
 *
 * Pre-configured with all built-in CDN loaders for optimal performance
 */
const defaultImageLoader = createImageLoader(defaultLoaderConfigs);

/**
 * Main image loader function
 *
 * This is the primary entry point for the image loader package.
 * It uses a registry pattern with O(1) lookup performance and
 * configuration-driven approach for maximum flexibility.
 *
 * @param params - Image loader parameters from Next.js
 * @returns Transformed image URL optimized for the detected CDN
 *
 * @example
 * ```typescript
 * import { imageLoader } from '@codefast/image-loader';
 *
 * // Basic usage
 * const transformedUrl = imageLoader({
 *   src: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
 *   width: 800,
 *   quality: 80
 * });
 * ```
 */
export function imageLoader(params: ImageLoaderProps): string {
  return defaultImageLoader.transform(params);
}

/**
 * Create a custom image loader with specific configuration
 *
 * @param config - Loader configuration options
 * @returns Custom image loader function
 *
 * @example
 * ```typescript
 * import { createCustomImageLoader } from '@codefast/image-loader';
 *
 * // Custom loader with only specific CDNs
 * const customLoader = createCustomImageLoader({
 *   loaders: [
 *     {
 *       name: 'cloudinary',
 *       matcher: (src) => src.includes('cloudinary.com'),
 *       loader: cloudinaryLoader
 *     }
 *   ],
 *   fallbackLoader: (params) => params.src
 * });
 * ```
 */
export function createCustomImageLoader(config: {
  loaders?: LoaderConfig[];
  fallbackLoader?: LoaderFunction;
}): (params: ImageLoaderProps) => string {
  const loader = createImageLoader(config.loaders, config.fallbackLoader);

  return (params: ImageLoaderProps) => loader.transform(params);
}
