import type { ImageLoaderProps } from "next/image";
import queryString, { type StringifiableRecord } from "query-string";

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
      // Imgix URL parameters:
      // w = width
      // q = quality (1-100)
      // auto = auto format and compress
      // fit = fit mode (crop, scale, etc.)
      // crop = crop mode (faces, entropy, etc.)

      const params: StringifiableRecord = {
        auto: "format,compress",
        crop: "faces,entropy",
        fit: "crop",
        q: quality,
        w: width,
      };

      return queryString.stringifyUrl({
        query: params,
        url: src,
      });
    } catch (error) {
      console.warn(`Failed to transform Imgix URL: ${src}`, error);
      return src;
    }
  }
}
