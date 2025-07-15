import type { ImageLoaderProps } from "next/image";

import { BaseImageLoader } from "@/base-loader";

/**
 * Image loader for Unsplash images
 * Handles images from images.unsplash.com
 */
export class UnsplashLoader extends BaseImageLoader {
  private static readonly DOMAIN = "images.unsplash.com";
  private static readonly NAME = "unsplash";

  public getName(): string {
    return UnsplashLoader.NAME;
  }

  public canHandle(source: string): boolean {
    const domain = this.extractDomain(source);
    return domain === UnsplashLoader.DOMAIN;
  }

  protected transformUrl(config: ImageLoaderProps): string {
    const { quality, src, width } = config;

    try {
      const url = new URL(src);

      // Unsplash URL parameters:
      // w = width
      // q = quality (1-100)
      // fm = format (auto, jpg, png, webp)
      // fit = fit mode (crop, scale, etc.)

      // Set width parameter
      url.searchParams.set("w", String(width));

      // Set quality parameter
      if (quality !== undefined) {
        url.searchParams.set("q", String(quality));
      }

      // Set format to auto for the best optimization
      url.searchParams.set("fm", "auto");

      // Use crop fit mode for consistent sizing
      url.searchParams.set("fit", "crop");

      return url.toString();
    } catch (error) {
      console.warn(`Failed to transform Unsplash URL: ${src}`, error);
      return src;
    }
  }
}
