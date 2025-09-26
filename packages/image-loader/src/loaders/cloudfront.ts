import type { ImageLoaderProps } from "next/image";

/**
 * AWS CloudFront URL transformation
 * Handles *.cloudfront.net domains
 *
 * @example
 * ```text
 * https://d1234567890.cloudfront.net/image.jpg
 * → https://d1234567890.cloudfront.net/image.jpg?f=auto&q=80&w=800
 * ```
 */
export function cloudfrontLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("f", "auto");
    url.searchParams.set("q", quality.toString());
    url.searchParams.set("w", width.toString());

    return url.toString();
  } catch {
    return src;
  }
}
