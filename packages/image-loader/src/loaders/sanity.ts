import type { ImageLoaderProps } from "next/image";

import { urlCache } from "@/utils/url-cache";

export function sanityLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  url.searchParams.set("w", width.toString());
  url.searchParams.set("q", quality.toString());

  return url.toString();
}
