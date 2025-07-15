import type { ImageLoaderProps } from "next/image";

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
    return SupabaseLoader.DOMAIN_PATTERN.test(domain) && source.includes('/storage/v1/');
  }

  protected transformUrl(config: ImageLoaderProps): string {
    const { quality, src, width } = config;

    try {
      const url = new URL(src);

      // Supabase Storage image transformation parameters:
      // width = width
      // quality = quality (1-100)
      // format = format (auto, webp, jpg, png)
      // resize = resize mode (cover, contain, fill)

      // Set width parameter
      url.searchParams.set("width", String(width));

      // Set quality parameter
      if (quality !== undefined) {
        url.searchParams.set("quality", String(quality));
      }

      // Request auto format for best optimization
      url.searchParams.set("format", "auto");

      // Use cover resize mode for consistent sizing
      url.searchParams.set("resize", "cover");

      return url.toString();
    } catch (error) {
      console.warn(`Failed to transform Supabase URL: ${src}`, error);
      return src;
    }
  }
}
