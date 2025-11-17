import type { ImageLoaderProps } from "next/image";

export function imageengineLoader({ quality = 75, src, width }: ImageLoaderProps): string {
  try {
    const compression = 100 - quality;
    const params = [`w_${width}`, `cmpr_${compression}`];
    const imgengParameter = `/${params.join("/")}`;

    const url = new URL(src);

    url.searchParams.set("imgeng", imgengParameter);

    return url.toString();
  } catch {
    return src;
  }
}
