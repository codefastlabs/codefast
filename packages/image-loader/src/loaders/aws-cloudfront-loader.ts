import type { ImageLoaderProps } from "next/image";
import type { StringifiableRecord } from "query-string";

import queryString from "query-string";

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
      // AWS CloudFront with Lambda@Edge or CloudFront Functions
      // Common query parameters for image optimization:
      // w = width
      // q = quality
      // f = format
      // fit = fit mode

      const params: StringifiableRecord = {
        f: "auto",
        fit: "cover",
        q: quality,
        w: width,
      };

      return queryString.stringifyUrl({
        query: params,
        url: src,
      });
    } catch (error) {
      console.warn(`Failed to transform AWS CloudFront URL: ${src}`, error);

      return src;
    }
  }
}
