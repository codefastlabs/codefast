import type { ImageLoaderProps } from "next/image";

/**
 * Cloudflare URL transformation
 * Handles Cloudflare CDN with automatic optimization
 *
 * @example
 * ```text
 * https://example.com/image.jpg
 * → https://example.com/cdn-cgi/image/width=800,quality=80,format=auto/image.jpg
 * ```
 */
export function cloudflareLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    const params = [`width=${width}`, `quality=${quality}`, "format=auto"];
    const transformedPath = `/cdn-cgi/image/${params.join(",")}${url.pathname}`;

    url.pathname = transformedPath;

    return url.toString();
  } catch {
    return src;
  }
}
