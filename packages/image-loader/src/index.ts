import type { ImageLoaderProps } from "next/image";

/**
 * Simple image loader for Next.js
 *
 * This is a functional, KISS-compliant implementation that leverages Next.js built-in capabilities.
 * No complex abstractions, no unnecessary caching, no over-engineering.
 *
 * @param params - Image loader parameters from Next.js
 * @returns Transformed image URL optimized for the detected CDN
 */
export function imageLoader(params: ImageLoaderProps): string {
  const { quality = 80, src, width } = params;

  // Simple domain-based routing - no complex registry needed
  if (src.includes("cloudinary.com")) {
    return transformCloudinaryUrl(src, width, quality);
  }

  if (src.includes("imgix.net")) {
    return transformImgixUrl(src, width, quality);
  }

  if (src.includes("images.unsplash.com")) {
    return transformUnsplashUrl(src, width, quality);
  }

  if (src.includes("cloudfront.net")) {
    return transformCloudFrontUrl(src, width, quality);
  }

  if (src.includes("supabase.co")) {
    return transformSupabaseUrl(src, width, quality);
  }

  if (src.includes("ctfassets.net")) {
    return transformContentfulUrl(src, width, quality);
  }

  if (src.includes("imagekit.io")) {
    return transformImageKitUrl(src, width, quality);
  }

  if (src.includes("cdn.sanity.io")) {
    return transformSanityUrl(src, width, quality);
  }

  // Fallback to original URL - Next.js will handle optimization
  return src;
}

/**
 * Cloudinary URL transformation
 * Handles *.cloudinary.com domains
 */
function transformCloudinaryUrl(src: string, width: number, quality: number): string {
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

/**
 * Imgix URL transformation
 * Handles *.imgix.net domains
 */
function transformImgixUrl(src: string, width: number, quality: number): string {
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

/**
 * Unsplash URL transformation
 * Handles images.unsplash.com
 */
function transformUnsplashUrl(src: string, width: number, quality: number): string {
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

/**
 * AWS CloudFront URL transformation
 * Handles *.cloudfront.net domains
 */
function transformCloudFrontUrl(src: string, width: number, quality: number): string {
  try {
    const url = new URL(src);

    url.searchParams.set("f", "auto");
    url.searchParams.set("q", quality.toString());
    url.searchParams.set("w", width.toString());

    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Supabase URL transformation
 * Handles *.supabase.co domains
 */
function transformSupabaseUrl(src: string, width: number, quality: number): string {
  try {
    const url = new URL(src);

    url.searchParams.set("format", "auto");
    url.searchParams.set("quality", quality.toString());
    url.searchParams.set("width", width.toString());

    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Contentful URL transformation
 * Handles *.ctfassets.net domains
 */
function transformContentfulUrl(src: string, width: number, quality: number): string {
  try {
    const url = new URL(src);

    url.searchParams.set("fm", "webp");
    url.searchParams.set("w", width.toString());
    url.searchParams.set("q", quality.toString());

    return url.toString();
  } catch {
    return src;
  }
}

/**
 * ImageKit URL transformation
 * Handles *.imagekit.io domains
 */
function transformImageKitUrl(src: string, width: number, quality: number): string {
  try {
    const url = new URL(src);
    const params = [`w-${width}`, `q-${quality}`];

    url.searchParams.set("tr", params.join(","));

    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Sanity URL transformation
 * Handles cdn.sanity.io domains
 */
function transformSanityUrl(src: string, width: number, quality: number): string {
  try {
    const url = new URL(src);

    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    url.searchParams.set("w", width.toString());
    url.searchParams.set("q", quality.toString());

    return url.toString();
  } catch {
    return src;
  }
}

// Export as default for convenience
export default imageLoader;
