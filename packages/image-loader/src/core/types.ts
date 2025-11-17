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
