import type { ImageLoaderProps } from "next/image";
import queryString, { type StringifiableRecord } from "query-string";

import { BaseImageLoader } from "@/base-loader";

/**
 * Image loader for Supabase Storage images
 * Handles images from *.supabase.co domains
 */
export class SupabaseLoader extends BaseImageLoader {
  private static readonly DOMAIN_PATTERN = /\.supabase\.co$/;
  private static readonly NAME = "supabase";

  public getName(): string {
    return SupabaseLoader.NAME;
  }

  public canHandle(source: string): boolean {
    const domain = this.extractDomain(source);
    return SupabaseLoader.DOMAIN_PATTERN.test(domain) && source.includes("/storage/v1/");
  }

  protected transformUrl(config: ImageLoaderProps): string {
    const { quality, src, width } = config;

    try {
      // Supabase Storage image transformation parameters:
      // width = width
      // quality = quality (1-100)
      // format = format (auto, webp, jpg, png)
      // resize = resize mode (cover, contain, fill)

      const params: StringifiableRecord = {
        format: "auto",
        quality: quality,
        resize: "cover",
        width: width,
      };

      return queryString.stringifyUrl({
        query: params,
        url: src,
      });
    } catch (error) {
      console.warn(`Failed to transform Supabase URL: ${src}`, error);
      return src;
    }
  }
}
