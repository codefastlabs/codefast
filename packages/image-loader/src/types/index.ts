import type { ImageLoaderProps } from "next/image";

/**
 * Simple function type for image loaders
 * Each loader is just a function that takes config and returns transformed URL
 */
export type ImageLoaderFunction = (config: ImageLoaderProps) => string;

/**
 * Loader definition with matching logic
 */
export interface LoaderDefinition {
  /** Function to check if this loader can handle the URL */
  canHandle: (src: string) => boolean;
  /** Function to transform the image URL */
  load: ImageLoaderFunction;
  /** Unique name for the loader */
  name: string;
}

/**
 * Enhanced configuration for the image loader system
 */
export interface ImageLoaderSystemConfig {
  /** Custom loaders to register */
  customLoaders?: ImageLoaderFunction[];
  /** Enable debug logging */
  debug?: boolean;
  /** Default quality to use when not specified */
  defaultQuality?: number;
  /** Enable/disable caching */
  enableCaching?: boolean;
  /** Loader priority order (higher number = higher priority) */
  loaderPriorities?: Record<string, number>;
  /** Maximum cache size for performance optimization */
  maxCacheSize?: number;
}