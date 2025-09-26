/**
 * Image loaders for various CDN providers
 *
 * These loaders are used internally by the defaultLoaderConfigs
 * and are not exported individually to reduce bundle size.
 */

// Internal exports for use in loader-registry.ts
export { cloudflareLoader } from "@/loaders/cloudflare";
export { cloudfrontLoader } from "@/loaders/cloudfront";
export { cloudinaryLoader } from "@/loaders/cloudinary";
export { contentfulLoader } from "@/loaders/contentful";
export { fastlyLoader } from "@/loaders/fastly";
export { gumletLoader } from "@/loaders/gumlet";
export { imageengineLoader } from "@/loaders/imageengine";
export { imagekitLoader } from "@/loaders/imagekit";
export { imgixLoader } from "@/loaders/imgix";
export { pixelbinLoader } from "@/loaders/pixelbin";
export { sanityLoader } from "@/loaders/sanity";
export { sirvLoader } from "@/loaders/sirv";
export { supabaseLoader } from "@/loaders/supabase";
export { thumborLoader } from "@/loaders/thumbor";
export { unsplashLoader } from "@/loaders/unsplash";
