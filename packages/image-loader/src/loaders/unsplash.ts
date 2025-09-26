import type { ImageLoaderProps } from "next/image";

/**
 * Unsplash URL transformation
 * Handles images.unsplash.com
 *
 * @example
 * ```text
 * https://images.unsplash.com/photo-1234567890
 * → https://images.unsplash.com/photo-1234567890?fit=crop&fm=auto&q=80&w=800
 * ```
 */
export function unsplashLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("fit", "crop");
    url.searchParams.set("fm", "auto");
    url.searchParams.set("q", quality.toString());
    url.searchParams.set("w", width.toString());

    return url.toString();
  } catch {
    return src;
  }
}
