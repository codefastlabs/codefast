import type { ImageLoaderProps } from "next/image";

import { createDefaultImageLoaderFactory } from "@codefast/image-loader";

/**
 * Image loader factory instance for the docs app
 * Pre-configured with all default CDN loaders
 */
const imageLoaderFactory = createDefaultImageLoaderFactory();

/**
 * Next.js compatible image loader function
 * This function is used by Next.js Image component to transform image URLs
 *
 * @param params - Image loader parameters from Next.js
 * @returns Transformed image URL optimized for the detected CDN
 */
export function imageLoader(params: ImageLoaderProps): string {
  return imageLoaderFactory.load(params);
}

// Export the factory instance as default for convenience
export default imageLoader;
