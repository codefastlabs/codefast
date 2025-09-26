/**
 * Image loaders for various CDN providers
 *
 * Each loader is a simple function that transforms image URLs
 * for specific CDN providers based on Next.js documentation.
 */

export { cloudflareLoader } from "./cloudflare";
export { cloudfrontLoader } from "./cloudfront";
export { cloudinaryLoader } from "./cloudinary";
export { contentfulLoader } from "./contentful";
export { fastlyLoader } from "./fastly";
export { gumletLoader } from "./gumlet";
export { imageengineLoader } from "./imageengine";
export { imagekitLoader } from "./imagekit";
export { imgixLoader } from "./imgix";
export { pixelbinLoader } from "./pixelbin";
export { sanityLoader } from "./sanity";
export { sirvLoader } from "./sirv";
export { supabaseLoader } from "./supabase";
export { thumborLoader } from "./thumbor";
export { unsplashLoader } from "./unsplash";
