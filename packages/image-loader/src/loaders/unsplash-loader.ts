import type { ImageLoaderProps } from "next/image";
import queryString, { type StringifiableRecord } from "query-string";

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
      // Unsplash URL parameters:
      // w = width
      // q = quality (1-100)
      // fm = format (auto, jpg, png, webp)
      // fit = fit mode (crop, scale, etc.)

      const params: StringifiableRecord = {
        fit: "crop",
        fm: "auto",
        q: quality,
        w: width,
      };

      return queryString.stringifyUrl({
        query: params,
        url: src,
      });
    } catch (error) {
      console.warn(`Failed to transform Unsplash URL: ${src}`, error);
      return src;
    }
  }
}
