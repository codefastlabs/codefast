import type { ImageLoaderProps } from "next/image";

import { DEFAULT_IMAGE_QUALITY } from "@/constants";
import { urlCache } from "@/utils/url-cache";

export function supabaseLoader({ quality = DEFAULT_IMAGE_QUALITY, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  url.searchParams.set("format", "auto");
  url.searchParams.set("quality", quality.toString());
  url.searchParams.set("width", width.toString());

  return url.toString();
}
