import { ImageLoaderFactory } from "@/loader-factory";
import { AWSCloudFrontLoader } from "@/loaders/aws-cloudfront-loader";
import { CloudinaryLoader } from "@/loaders/cloudinary-loader";
import { ImgixLoader } from "@/loaders/imgix-loader";
import { SupabaseLoader } from "@/loaders/supabase-loader";
import { UnsplashLoader } from "@/loaders/unsplash-loader";

/**
 * Registers all default image loaders to the factory
 * This function provides a convenient way to set up all supported CDN loaders
 */
export function registerDefaultLoaders(factory: ImageLoaderFactory): void {
  const defaultLoaders = [
    new UnsplashLoader(),
    new CloudinaryLoader(),
    new ImgixLoader(),
    new AWSCloudFrontLoader(),
    new SupabaseLoader(),
  ];

  factory.registerLoaders(defaultLoaders);
}

/**
 * Creates a new ImageLoaderFactory with all default loaders registered
 * This is a convenience function for quick setup
 */
export function createDefaultImageLoaderFactory(): ImageLoaderFactory {
  const factory = new ImageLoaderFactory();

  registerDefaultLoaders(factory);

  return factory;
}
