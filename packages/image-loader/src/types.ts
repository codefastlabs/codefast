import type { ImageLoaderProps } from "next/image";

/**
 * Base interface for all image loaders
 * Following the Interface Segregation Principle (ISP)
 */
export interface ImageLoader {
  /**
   * Transforms the image URL according to the loader's CDN specifications
   * @param config - Image transformation configuration
   * @returns Transformed image URL
   */
  load: (config: ImageLoaderProps) => string;

  /**
   * Checks if this loader can handle the given source URL
   * @param src - Source URL to check
   * @returns True if this loader can handle the URL
   */
  canHandle: (source: string) => boolean;

  /**
   * Gets the name/identifier of this loader
   * @returns Loader name
   */
  getName: () => string;
}

/**
 * Configuration options for image loader factory
 */
export interface ImageLoaderFactoryConfig {
  /** Default quality to use when not specified */
  defaultQuality?: number;
  /** Custom domain mappings for loaders */
  domainMappings?: Record<string, string>;
}

/**
 * Supported CDN providers
 */
export type CDNProvider =
  | "akamai"
  | "aws-cloudfront"
  | "cloudflare"
  | "cloudinary"
  | "contentful"
  | "fastly"
  | "gumlet"
  | "imageengine"
  | "imagekit"
  | "imgix"
  | "nitrogen-aio"
  | "pixelbin"
  | "sanity"
  | "sirv"
  | "supabase"
  | "thumbor"
  | "unsplash";
