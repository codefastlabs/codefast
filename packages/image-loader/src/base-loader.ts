import type { ImageLoaderProps } from "next/image";

import type { ImageLoader } from "@/types";

/**
 * Abstract base class for image loaders
 * Implements the Template Method pattern and follows the Open/Closed Principle
 */
export abstract class BaseImageLoader implements ImageLoader {
  protected readonly defaultQuality: number = 75;

  constructor(protected readonly config?: { defaultQuality?: number }) {
    if (config?.defaultQuality) {
      this.defaultQuality = config.defaultQuality;
    }
  }

  /**
   * Template method that defines the algorithm for loading images
   * Follows the Template Method pattern
   */
  public load(config: ImageLoaderProps): string {
    // Validate input parameters
    this.validateConfig(config);

    // Normalize the configuration
    const normalizedConfig = this.normalizeConfig(config);

    // Transform the URL using the specific loader implementation
    return this.transformUrl(normalizedConfig);
  }

  /**
   * Abstract method to check if this loader can handle the given URL
   * Each loader defines its own domain/pattern matching logic
   */
  public abstract canHandle(source: string): boolean;

  /**
   * Abstract method to get the loader name
   * Each loader provides its own identifier
   */
  public abstract getName(): string;

  /**
   * Abstract method to be implemented by concrete loaders
   * Each loader defines its own URL transformation logic
   */
  protected abstract transformUrl(config: ImageLoaderProps): string;

  /**
   * Validates the input configuration
   * Common validation logic for all loaders
   */
  protected validateConfig(config: ImageLoaderProps): void {
    if (!config.src) {
      throw new Error("Image source URL is required");
    }

    if (!config.width || config.width <= 0) {
      throw new Error("Image width must be a positive number");
    }

    if (config.quality !== undefined && (config.quality < 1 || config.quality > 100)) {
      throw new Error("Image quality must be between 1 and 100");
    }
  }

  /**
   * Normalizes the configuration by applying defaults
   * Common normalization logic for all loaders
   */
  protected normalizeConfig(config: ImageLoaderProps): ImageLoaderProps {
    return {
      ...config,
      quality: config.quality ?? this.defaultQuality,
    };
  }

  /**
   * Utility method to extract domain from URL
   * Helper method for domain-based loader selection
   */
  protected extractDomain(url: string): string {
    try {
      const urlObject = new URL(url);
      return urlObject.hostname.toLowerCase();
    } catch {
      return "";
    }
  }

  /**
   * Utility method to build query parameters
   * Helper method for URL construction
   */
  protected buildQueryParams(params: Record<string, number | string | undefined>): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  /**
   * Utility method to ensure URL has protocol
   * Helper method for URL normalization
   */
  protected ensureProtocol(url: string, defaultProtocol = "https"): string {
    if (url.startsWith("//")) {
      return `${defaultProtocol}:${url}`;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `${defaultProtocol}://${url}`;
    }
    return url;
  }
}
