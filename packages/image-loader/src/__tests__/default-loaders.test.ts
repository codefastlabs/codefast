import { createDefaultImageLoaderFactory, registerDefaultLoaders } from "@/default-loaders";
import { ImageLoaderFactory } from "@/loader-factory";
import { AWSCloudFrontLoader } from "@/loaders/aws-cloudfront-loader";
import { CloudinaryLoader } from "@/loaders/cloudinary-loader";
import { ImgixLoader } from "@/loaders/imgix-loader";
import { SupabaseLoader } from "@/loaders/supabase-loader";
import { UnsplashLoader } from "@/loaders/unsplash-loader";

describe("default-loaders", () => {
  describe("registerDefaultLoaders", () => {
    it("should register all default loaders to the factory", () => {
      const factory = new ImageLoaderFactory();
      const registerLoadersSpy = jest.spyOn(factory, "registerLoaders");

      registerDefaultLoaders(factory);

      expect(registerLoadersSpy).toHaveBeenCalledTimes(1);

      const registeredLoaders = registerLoadersSpy.mock.calls[0][0];

      expect(registeredLoaders).toHaveLength(5);

      // Verify all expected loader types are registered
      expect(registeredLoaders.some((loader) => loader instanceof UnsplashLoader)).toBe(true);
      expect(registeredLoaders.some((loader) => loader instanceof CloudinaryLoader)).toBe(true);
      expect(registeredLoaders.some((loader) => loader instanceof ImgixLoader)).toBe(true);
      expect(registeredLoaders.some((loader) => loader instanceof AWSCloudFrontLoader)).toBe(true);
      expect(registeredLoaders.some((loader) => loader instanceof SupabaseLoader)).toBe(true);
    });

    it("should register loaders in the correct order", () => {
      const factory = new ImageLoaderFactory();
      const registerLoadersSpy = jest.spyOn(factory, "registerLoaders");

      registerDefaultLoaders(factory);

      const registeredLoaders = registerLoadersSpy.mock.calls[0][0];

      // Verify the order of registration
      expect(registeredLoaders[0]).toBeInstanceOf(UnsplashLoader);
      expect(registeredLoaders[1]).toBeInstanceOf(CloudinaryLoader);
      expect(registeredLoaders[2]).toBeInstanceOf(ImgixLoader);
      expect(registeredLoaders[3]).toBeInstanceOf(AWSCloudFrontLoader);
      expect(registeredLoaders[4]).toBeInstanceOf(SupabaseLoader);
    });

    it("should work with an empty factory", () => {
      const factory = new ImageLoaderFactory();

      expect(() => {
        registerDefaultLoaders(factory);
      }).not.toThrow();
    });
  });

  describe("createDefaultImageLoaderFactory", () => {
    it("should create a new ImageLoaderFactory instance", () => {
      const factory = createDefaultImageLoaderFactory();

      expect(factory).toBeInstanceOf(ImageLoaderFactory);
    });

    it("should create a factory with all default loaders registered", () => {
      const factory = createDefaultImageLoaderFactory();

      // Test that the factory can handle URLs from all supported CDNs
      expect(factory.findLoader("https://images.unsplash.com/photo-123")).toBeDefined();
      expect(
        factory.findLoader("https://res.cloudinary.com/demo/image/upload/sample.jpg"),
      ).toBeDefined();
      expect(factory.findLoader("https://demo.imgix.net/sample.jpg")).toBeDefined();
      expect(factory.findLoader("https://d123456.cloudfront.net/sample.jpg")).toBeDefined();
      expect(
        factory.findLoader(
          "https://project.supabase.co/storage/v1/object/public/bucket/sample.jpg",
        ),
      ).toBeDefined();
    });

    it("should create independent factory instances", () => {
      const factory1 = createDefaultImageLoaderFactory();
      const factory2 = createDefaultImageLoaderFactory();

      expect(factory1).not.toBe(factory2);
      expect(factory1).toBeInstanceOf(ImageLoaderFactory);
      expect(factory2).toBeInstanceOf(ImageLoaderFactory);
    });

    it("should create a factory that can load images from supported CDNs", () => {
      const factory = createDefaultImageLoaderFactory();

      // Test actual URL transformation for each CDN
      const unsplashUrl = factory.load({
        quality: 75,
        src: "https://images.unsplash.com/photo-123",
        width: 800,
      });

      expect(unsplashUrl).toContain("w=800");
      expect(unsplashUrl).toContain("q=75");

      const cloudinaryUrl = factory.load({
        quality: 75,
        src: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        width: 800,
      });

      expect(cloudinaryUrl).toContain("w_800");
      expect(cloudinaryUrl).toContain("q_75");

      const imgixUrl = factory.load({
        quality: 75,
        src: "https://demo.imgix.net/sample.jpg",
        width: 800,
      });

      expect(imgixUrl).toContain("w=800");
      expect(imgixUrl).toContain("q=75");
    });
  });
});
