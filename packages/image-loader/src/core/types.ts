import type { ImageLoaderProps } from "next/image";

/**
 * Image loader function type
 */
export type LoaderFunction = (params: ImageLoaderProps) => string;

/**
 * Loader configuration interface
 */
export interface LoaderConfig {
  /** Function to transform the image URL */
  loader: LoaderFunction;
  /** Function to determine if this loader should handle the URL */
  matcher: (src: string) => boolean;
  /** Unique name for the loader */
  name: string;
}

/**
 * Image loader configuration options
 */
export interface ImageLoaderOptions {
  /** Enable debug logging */
  debug?: boolean;
  /** Fallback loader for unmatched URLs */
  fallbackLoader?: LoaderFunction;
  /** Custom loaders to register */
  loaders?: LoaderConfig[];
}
