import type { ImageLoaderProps } from "next/image";

/**
 * Cloudinary URL transformation
 * Handles *.cloudinary.com domains
 *
 * @example
 * ```text
 * https://res.cloudinary.com/demo/image/upload/sample.jpg
 * → https://res.cloudinary.com/demo/image/upload/w_800,q_80,f_auto,c_fill/sample.jpg
 * ```
 */
export function cloudinaryLoader({ quality = 80, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    const pathParts = url.pathname.split("/");
    const uploadIndex = pathParts.indexOf("upload");

    if (uploadIndex === -1) {
      return src; // Invalid Cloudinary URL structure
    }

    const transformations = [`w_${width}`, `q_${quality}`, "f_auto", "c_fill"];
    const newPathParts = [
      ...pathParts.slice(0, uploadIndex + 1),
      transformations.join(","),
      ...pathParts.slice(uploadIndex + 1),
    ];

    url.pathname = newPathParts.join("/");

    return url.toString();
  } catch {
    return src;
  }
}
