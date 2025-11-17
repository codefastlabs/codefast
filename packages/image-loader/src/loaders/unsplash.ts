import type { ImageLoaderProps } from "next/image";

export function unsplashLoader({ quality = 75, src, width }: ImageLoaderProps): string {
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
