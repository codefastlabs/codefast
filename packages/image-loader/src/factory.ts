import type { ImageLoaderSystemConfig } from "@/types";

import { ImageLoaderSystem } from "@/core/image-loader-system";
import { builtInLoaders } from "@/loaders";

/**
 * Creates an enhanced image loader system with performance optimizations
 *
 * This factory function creates a new ImageLoaderSystem instance with the provided
 * configuration and automatically registers all built-in loaders for common CDN providers.
 *
 * @param config - Configuration options for the image loader system
 * @returns Enhanced image loader system with built-in loaders registered
 *
 * @example
 * ```typescript
 * // Basic usage with default configuration
 * const system = createImageLoaderSystem();
 * const loader = system.createLoader();
 *
 * // Advanced configuration with custom loaders and caching
 * const system = createImageLoaderSystem({
 *   defaultQuality: 80,
 *   enableCaching: true,
 *   maxCacheSize: 2000,
 *   customLoaders: [myCustomLoader],
 *   loaderPriorities: { "cloudinary": 100 },
 *   debug: true
 * });
 *
 * // Register additional loaders if needed
 * system.registerBuiltInLoaders(extendedLoaders);
 * const loader = system.createLoader();
 * ```
 */
export function createImageLoaderSystem(config: ImageLoaderSystemConfig = {}): ImageLoaderSystem {
  const system = new ImageLoaderSystem(config);

  system.registerBuiltInLoaders(builtInLoaders);

  return system;
}

/**
 * Default image loader system instance
 *
 * Pre-configured with all built-in loaders and performance optimizations.
 * This singleton instance provides a ready-to-use image loader system
 * with sensible defaults for most use cases.
 *
 * @example
 * ```typescript
 * // Use the default system directly
 * const loader = defaultImageLoaderSystem.createLoader();
 *
 * // Or configure it further
 * defaultImageLoaderSystem.registerBuiltInLoaders(extendedLoaders);
 * const loader = defaultImageLoaderSystem.createLoader();
 * ```
 */
export const defaultImageLoaderSystem = createImageLoaderSystem();
