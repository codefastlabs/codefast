import type { ImageLoaderProps } from "next/image";

import { BaseImageLoader } from "@/base-loader";

/**
 * Image loader for Imgix images
 * Handles images from *.imgix.net domains and custom Imgix domains
 */
export class ImgixLoader extends BaseImageLoader {
  private static readonly DOMAIN_PATTERN = /\.imgix\.net$/;
  private static readonly NAME = "imgix";

  public getName(): string {
    return ImgixLoader.NAME;
  }

  public canHandle(source: string): boolean {
    const domain = this.extractDomain(source);
    return ImgixLoader.DOMAIN_PATTERN.test(domain);
  }

  protected transformUrl(config: ImageLoaderProps): string {
    const { quality, src, width } = config;

    try {
      const url = new URL(src);

      // Imgix URL parameters:
      // w = width
      // q = quality (1-100)
      // auto = auto format and compress
      // fit = fit mode (crop, scale, etc.)
      // crop = crop mode (faces, entropy, etc.)

      // Set width parameter
      url.searchParams.set("w", String(width));

      // Set quality parameter
      if (quality !== undefined) {
        url.searchParams.set("q", String(quality));
      }

      // Enable auto format and compression
      url.searchParams.set("auto", "format,compress");

      // Use crop fit mode for consistent sizing
      url.searchParams.set("fit", "crop");

      // Use faces crop mode for better cropping of images with people
      url.searchParams.set("crop", "faces,entropy");

      return url.toString();
    } catch (error) {
      console.warn(`Failed to transform Imgix URL: ${src}`, error);
      return src;
    }
  }
}
