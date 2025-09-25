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
  cloudinaryLoader,
  extendedLoaders,
  imgixLoader,
  supabaseLoader,
  unsplashLoader,
} from "@/loaders";

/**
 * Export extended loaders for additional CDN providers
 */
export {
  cloudflareLoader,
  contentfulLoader,
  fastlyLoader,
  gumletLoader,
  imageEngineLoader,
  imageKitLoader,
  pixelBinLoader,
  sanityLoader,
  sirvLoader,
  thumborLoader,
} from "@/loaders/extended-loaders";

/**
 * Export utility functions for URL manipulation and validation
 */
export { ensureProtocol, extractDomain, normalizeConfig, validateConfig } from "@/utils";

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
  ImageLoaderProps,
  ImageLoaderSystemConfig,
  LoaderDefinition,
} from "@/types";
