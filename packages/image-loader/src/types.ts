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
 * Configuration for creating image loader
 */
export interface ImageLoaderConfig {
  /** Custom loaders to register */
  customLoaders?: ImageLoaderFunction[];
  /** Default quality to use when not specified */
  defaultQuality?: number;
}

/**
 * Re-export Next.js ImageLoaderProps for convenience
 */
export type { ImageLoaderProps } from "next/image";