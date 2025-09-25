import type { ImageLoaderProps } from "next/image";

import type { ImageLoaderConfig, ImageLoaderFunction } from "./types";

import { builtInLoaders } from "./loaders";

/**
 * Creates an image loader function with built-in and custom loaders
 * 
 * @param config - Configuration options for the image loader
 * @returns Next.js compatible image loader function
 * 
 * @example
 * ```typescript
 * // Simple usage with default loaders
 * const loader = createImageLoader();
 * 
 * // With custom configuration
 * const loader = createImageLoader({
 *   defaultQuality: 80,
 *   customLoaders: [myCustomLoader]
 * });
 * ```
 */
export function createImageLoader(config: ImageLoaderConfig = {}): ImageLoaderFunction {
  const { customLoaders = [], defaultQuality = 75 } = config;
  
  return (params: ImageLoaderProps): string => {
    const { src } = params;
    
    // Try built-in loaders first
    for (const loaderDefinition of builtInLoaders) {
      if (loaderDefinition.canHandle(src)) {
        try {
          return loaderDefinition.load({
            ...params,
            quality: params.quality ?? defaultQuality,
          });
        } catch (error) {
          console.warn(`Loader ${loaderDefinition.name} failed for ${src}:`, error);
          // Continue to next loader
        }
      }
    }
    
    // Try custom loaders
    for (const customLoader of customLoaders) {
      try {
        return customLoader({
          ...params,
          quality: params.quality ?? defaultQuality,
        });
      } catch (error) {
        console.warn(`Custom loader failed for ${src}:`, error);
        // Continue to next loader
      }
    }
    
    // Fallback: return original URL if no loader can handle it
    console.warn(`No loader found for URL: ${src}. Returning original URL.`);

    return src;
  };
}

/**
 * Default image loader instance
 * Pre-configured with all built-in loaders
 */
export const defaultImageLoader = createImageLoader();

/**
 * Export individual loaders for advanced usage
 */
export {
  awsCloudFrontLoader,
  builtInLoaders,
  cloudinaryLoader,
  imgixLoader,
  supabaseLoader,
  unsplashLoader,
} from "./loaders";

/**
 * Export utility functions
 */
export {
  ensureProtocol,
  extractDomain,
  normalizeConfig,
  validateConfig,
} from "./utils";

/**
 * Export types
 */
export type {
  ImageLoaderConfig,
  ImageLoaderFunction,
  ImageLoaderProps,
  LoaderDefinition,
} from "./types";

/**
 * Default export for Next.js configuration
 * This can be used directly in next.config.js
 */
export default defaultImageLoader;