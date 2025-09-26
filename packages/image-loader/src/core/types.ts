import type { ImageLoaderProps } from "next/image";

/**
 * Image loader function type
 */
export type LoaderFunction = (params: ImageLoaderProps) => string;

/**
 * Loader configuration interface
 */
export interface LoaderConfig {
  /** Optional domain for O(1) lookup optimization */
  domain?: string;
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
  /** Enable caching for better performance */
  enableCache?: boolean;
  /** Fallback loader for unmatched URLs */
  fallbackLoader?: LoaderFunction;
  /** Custom loaders to register */
  loaders?: LoaderConfig[];
  /** Maximum cache size (default: 1000) */
  maxCacheSize?: number;
}

/**
 * Cache entry for URL parsing and transformation results
 */
export interface CacheEntry {
  /** Transformed result */
  result?: string;
  /** Timestamp for LRU eviction */
  timestamp: number;
  /** Parsed URL object */
  url?: URL;
}
