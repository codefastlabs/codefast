import type { ImageLoaderProps } from "next/image";

import { BaseImageLoader } from "@/base-loader";

/**
 * Image loader for Cloudinary images
 * Handles images from *.cloudinary.com domains
 */
export class CloudinaryLoader extends BaseImageLoader {
  private static readonly DOMAIN_PATTERN = /\.cloudinary\.com$/;
  private static readonly NAME = "cloudinary";

  public getName(): string {
    return CloudinaryLoader.NAME;
  }

  public canHandle(source: string): boolean {
    const domain = this.extractDomain(source);

    return CloudinaryLoader.DOMAIN_PATTERN.test(domain);
  }

  protected transformUrl(config: ImageLoaderProps): string {
    const { quality, src, width } = config;

    try {
      const url = new URL(src);
      const pathParts = url.pathname.split("/");

      // Cloudinary URL structure: /image/upload/transformations/version/public_id.format
      // Find the upload segment to insert transformations
      const uploadIndex = pathParts.indexOf("upload");

      if (uploadIndex === -1) {
        console.warn(`Invalid Cloudinary URL structure: ${src}`);

        return src;
      }

      // Build transformation parameters
      const transformations: string[] = [];

      // Width transformation
      transformations.push(`w_${width.toString()}`);

      // Quality transformation
      if (quality !== undefined) {
        transformations.push(`q_${quality.toString()}`);
      }

      // Auto format for best optimization
      transformations.push("f_auto", "c_fill");

      // Insert transformations after upload
      const newPathParts = [
        ...pathParts.slice(0, uploadIndex + 1),
        transformations.join(","),
        ...pathParts.slice(uploadIndex + 1),
      ];

      url.pathname = newPathParts.join("/");

      return url.toString();
    } catch (error) {
      console.warn(`Failed to transform Cloudinary URL: ${src}`, error);

      return src;
    }
  }
}
