import type { ImageLoaderProps } from "next/image";

export function sirvLoader({ quality = 85, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    const params = url.searchParams;

    params.set("format", params.getAll("format").join(",") || "optimal");
    params.set("w", params.get("w") ?? width.toString());
    params.set("q", quality.toString());

    return url.toString();
  } catch {
    return src;
  }
}
