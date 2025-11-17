import type { ImageLoaderProps } from "next/image";

export function imgixLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("auto", "format");
    url.searchParams.set("q", quality.toString());
    url.searchParams.set("w", width.toString());

    return url.toString();
  } catch {
    return src;
  }
}
