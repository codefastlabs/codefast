import type { ImageLoaderProps } from "next/image";

import {
  cloudflareLoader,
  cloudfrontLoader,
  cloudinaryLoader,
  contentfulLoader,
  fastlyLoader,
  gumletLoader,
  imageengineLoader,
  imagekitLoader,
  imgixLoader,
  pixelbinLoader,
  sanityLoader,
  sirvLoader,
  supabaseLoader,
  thumborLoader,
  unsplashLoader,
} from "./loaders";

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
  const { src } = params;

  // Simple domain-based routing - no complex registry needed
  if (src.includes("cloudinary.com")) {
    return cloudinaryLoader(params);
  }

  if (src.includes("imgix.net")) {
    return imgixLoader(params);
  }

  if (src.includes("images.unsplash.com")) {
    return unsplashLoader(params);
  }

  if (src.includes("cloudfront.net")) {
    return cloudfrontLoader(params);
  }

  if (src.includes("supabase.co")) {
    return supabaseLoader(params);
  }

  if (src.includes("ctfassets.net")) {
    return contentfulLoader(params);
  }

  if (src.includes("imagekit.io")) {
    return imagekitLoader(params);
  }

  if (src.includes("cdn.sanity.io")) {
    return sanityLoader(params);
  }

  if (src.includes("cloudflare") || src.includes("/cdn-cgi/image/")) {
    return cloudflareLoader(params);
  }

  if (src.includes("fastly")) {
    return fastlyLoader(params);
  }

  if (src.includes("gumlet")) {
    return gumletLoader(params);
  }

  if (src.includes("imageengine") || src.includes("imgeng")) {
    return imageengineLoader(params);
  }

  if (src.includes("pixelbin.io")) {
    return pixelbinLoader(params);
  }

  if (src.includes("sirv")) {
    return sirvLoader(params);
  }

  if (src.includes("thumbor")) {
    return thumborLoader(params);
  }

  // Fallback to original URL - Next.js will handle optimization
  return src;
}

// Export individual loaders for advanced usage
export {
  cloudflareLoader,
  cloudfrontLoader,
  cloudinaryLoader,
  contentfulLoader,
  fastlyLoader,
  gumletLoader,
  imageengineLoader,
  imagekitLoader,
  imgixLoader,
  pixelbinLoader,
  sanityLoader,
  sirvLoader,
  supabaseLoader,
  thumborLoader,
  unsplashLoader,
} from "./loaders";

// Export as default for convenience
export default imageLoader;
