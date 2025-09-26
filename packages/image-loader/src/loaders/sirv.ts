import type { ImageLoaderProps } from "next/image";

/**
 * Sirv URL transformation
 * Handles Sirv CDN
 *
 * @example
 * ```text
 * https://example.com/image.jpg
 * → https://example.com/image.jpg?format=optimal&w=800&q=85
 * ```
 */
export function sirvLoader({ quality = 85, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    const params = url.searchParams;

    params.set("format", params.getAll("format").join(",") || "optimal");
    params.set("w", params.get("w") ?? width.toString());
    params.set("q", quality.toString());

    return url.toString();
  } catch {
    return src;
  }
}
