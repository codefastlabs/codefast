import type { ImageLoaderProps } from "next/image";

import { BaseImageLoader } from "@/base-loader";

/**
 * Image loader for AWS CloudFront images
 * Handles images from *.cloudfront.net domains
 */
export class AWSCloudFrontLoader extends BaseImageLoader {
  private static readonly DOMAIN_PATTERN = /\.cloudfront\.net$/;
  private static readonly NAME = "aws-cloudfront";

  public getName(): string {
    return AWSCloudFrontLoader.NAME;
  }

  public canHandle(source: string): boolean {
    const domain = this.extractDomain(source);
    return AWSCloudFrontLoader.DOMAIN_PATTERN.test(domain);
  }

  protected transformUrl(config: ImageLoaderProps): string {
    const { quality, src, width } = config;

    try {
      const url = new URL(src);

      // AWS CloudFront with Lambda@Edge or CloudFront Functions
      // Common query parameters for image optimization:
      // w = width
      // q = quality
      // f = format
      // fit = fit mode

      // Set width parameter
      url.searchParams.set("w", String(width));

      // Set quality parameter
      if (quality !== undefined) {
        url.searchParams.set("q", String(quality));
      }

      // Request auto format (if supported by the Lambda function)
      url.searchParams.set("f", "auto");

      // Use cover fit mode for consistent sizing
      url.searchParams.set("fit", "cover");

      return url.toString();
    } catch (error) {
      console.warn(`Failed to transform AWS CloudFront URL: ${src}`, error);
      return src;
    }
  }
}
