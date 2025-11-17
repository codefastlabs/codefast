import type { ImageLoaderProps } from "next/image";

export function supabaseLoader({ quality = 75, src, width }: ImageLoaderProps): string {
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
