import type { ImageLoaderProps } from "next/image";

import { urlCache } from "@/utils/url-cache";

export function cloudfrontLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  url.searchParams.set("f", "auto");
  url.searchParams.set("q", quality.toString());
  url.searchParams.set("w", width.toString());

  return url.toString();
}
