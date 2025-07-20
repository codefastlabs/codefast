// Types and interfaces
export type { CDNProvider, ImageLoader, ImageLoaderFactoryConfig } from "@/types";

// Base image loader class
export { BaseImageLoader } from "@/base-loader";

// Image loader factory functionality
export { defaultImageLoaderFactory, ImageLoaderFactory } from "@/loader-factory";

// Built-in CDN image loaders
export { AWSCloudFrontLoader } from "@/loaders/aws-cloudfront-loader";
export { CloudinaryLoader } from "@/loaders/cloudinary-loader";
export { ImgixLoader } from "@/loaders/imgix-loader";
export { SupabaseLoader } from "@/loaders/supabase-loader";
export { UnsplashLoader } from "@/loaders/unsplash-loader";

// Default loader registration and setup
export { createDefaultImageLoaderFactory, registerDefaultLoaders } from "@/default-loaders";
