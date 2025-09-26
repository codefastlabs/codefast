import type { ImageLoaderProps } from "next/image";

/**
 * Supabase URL transformation
 * Handles *.supabase.co domains
 *
 * @example
 * ```text
 * https://xyz.supabase.co/storage/v1/object/public/bucket/image.jpg
 * → https://xyz.supabase.co/storage/v1/object/public/bucket/image.jpg?format=auto&quality=80&width=800
 * ```
 */
export function supabaseLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("format", "auto");
    url.searchParams.set("quality", quality.toString());
    url.searchParams.set("width", width.toString());

    return url.toString();
  } catch {
    return src;
  }
}
