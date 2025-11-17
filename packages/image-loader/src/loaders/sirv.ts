import type { ImageLoaderProps } from "next/image";

import { DEFAULT_IMAGE_QUALITY } from "@/constants";
import { urlCache } from "@/utils/url-cache";

export function sirvLoader({ quality = DEFAULT_IMAGE_QUALITY, src, width }: ImageLoaderProps): string {
  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  const params = url.searchParams;

  params.set("format", params.getAll("format").join(",") || "optimal");
  params.set("w", params.get("w") ?? width.toString());
  params.set("q", quality.toString());

  return url.toString();
}
