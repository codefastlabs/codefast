import type { ImageLoaderProps } from "next/image";

import { DEFAULT_IMAGE_QUALITY } from "@/constants";
import { urlCache } from "@/utils/url-cache";

export function imageengineLoader({ quality = DEFAULT_IMAGE_QUALITY, src, width }: ImageLoaderProps): string {
  const compression = 100 - quality;
  const params = [`w_${width}`, `cmpr_${compression}`];
  const imgengParameter = `/${params.join("/")}`;

  const url = urlCache.getClone(src);

  if (!url) {
    return src;
  }

  url.searchParams.set("imgeng", imgengParameter);

  return url.toString();
}
