/**
 * Main exports from the image loader package
 *
 * This file serves as the main entry point and only contains exports.
 * All function implementations are in separate files for better organization.
 */

/**
 * Factory functions for creating image loader systems
 */
export { createImageLoaderSystem, defaultImageLoaderSystem } from "@/factory";

/**
 * Export individual loaders for advanced usage
 */
export {
  allLoaders,
  awsCloudFrontLoader,
  builtInLoaders,
  cloudflareLoader,
  cloudinaryLoader,
  contentfulLoader,
  extendedLoaders,
  fastlyLoader,
  gumletLoader,
  imageEngineLoader,
  imageKitLoader,
  imgixLoader,
  pixelBinLoader,
  sanityLoader,
  sirvLoader,
  supabaseLoader,
  thumborLoader,
  unsplashLoader,
} from "@/loaders";

/**
 * Export utility functions for URL manipulation
 */
export { ensureProtocol, extractDomain } from "@/utils";

/**
 * Export core classes for advanced usage and customization
 */
export { ImageLoaderSystem } from "@/core/image-loader-system";
export { LoaderDefinitionBuilder } from "@/core/loader-builder";
export { LoaderRegistry } from "@/core/loader-registry";

/**
 * Export TypeScript type definitions
 */
export type {
  ImageLoaderFunction,
  ImageLoaderSystemConfig,
  LoaderDefinition,
} from "@/types";
