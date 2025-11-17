import type { ImageLoaderProps } from "next/image";

export function defaultLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("w", width.toString());
    url.searchParams.set("q", quality.toString());

    return url.toString();
  } catch {
    return src;
  }
}
