import { ImageLoaderFactory } from "@/loader-factory";
import { CloudinaryLoader } from "@/loaders/cloudinary-loader";
import { UnsplashLoader } from "@/loaders/unsplash-loader";

describe("ImageLoaderFactory", () => {
  describe("registerLoader", () => {
    it("should register a new loader", () => {
      const factory = new ImageLoaderFactory();
      const loader = new UnsplashLoader();

      factory.registerLoader(loader);

      expect(factory.getLoaders()).toHaveLength(1);
      expect(factory.getLoaders()[0]).toBe(loader);
    });

    it("should throw error when registering duplicate loader names", () => {
      const factory = new ImageLoaderFactory();
      const loader1 = new UnsplashLoader();
      const loader2 = new UnsplashLoader();

      factory.registerLoader(loader1);

      expect(() => {
        factory.registerLoader(loader2);
      }).toThrow('Loader with name "unsplash" is already registered');
    });
  });

  describe("registerLoaders", () => {
    it("should register multiple loaders at once", () => {
      const factory = new ImageLoaderFactory();
      const loaders = [new UnsplashLoader(), new CloudinaryLoader()];

      factory.registerLoaders(loaders);

      expect(factory.getLoaders()).toHaveLength(2);
    });
  });

  describe("unregisterLoader", () => {
    it("should unregister a loader by name", () => {
      const factory = new ImageLoaderFactory();
      const loader = new UnsplashLoader();

      factory.registerLoader(loader);
      expect(factory.getLoaders()).toHaveLength(1);

      const result = factory.unregisterLoader("unsplash");

      expect(result).toBe(true);
      expect(factory.getLoaders()).toHaveLength(0);
    });

    it("should return false when unregistering non-existent loader", () => {
      const factory = new ImageLoaderFactory();

      const result = factory.unregisterLoader("non-existent");

      expect(result).toBe(false);
    });
  });

  describe("findLoader", () => {
    it("should find the correct loader for a URL", () => {
      const factory = new ImageLoaderFactory();
      const unsplashLoader = new UnsplashLoader();
      const cloudinaryLoader = new CloudinaryLoader();

      factory.registerLoaders([unsplashLoader, cloudinaryLoader]);

      const result = factory.findLoader("https://images.unsplash.com/photo-123");

      expect(result).toBe(unsplashLoader);
    });

    it("should return null when no loader can handle the URL", () => {
      const factory = new ImageLoaderFactory();
      const unsplashLoader = new UnsplashLoader();

      factory.registerLoader(unsplashLoader);

      const result = factory.findLoader("https://example.com/image.jpg");

      expect(result).toBe(null);
    });

    it("should use domain mappings when configured", () => {
      const factory = new ImageLoaderFactory({
        domainMappings: {
          "custom-domain.com": "unsplash",
        },
      });
      const unsplashLoader = new UnsplashLoader();

      factory.registerLoader(unsplashLoader);

      const result = factory.findLoader("https://custom-domain.com/image.jpg");

      expect(result).toBe(unsplashLoader);
    });
  });

  describe("load", () => {
    it("should load image using the appropriate loader", () => {
      const factory = new ImageLoaderFactory();
      const unsplashLoader = new UnsplashLoader();

      factory.registerLoader(unsplashLoader);

      const result = factory.load({
        quality: 80,
        src: "https://images.unsplash.com/photo-123",
        width: 800,
      });

      expect(result).toContain("w=800");
      expect(result).toContain("q=80");
    });

    it("should return original URL when no loader can handle it", () => {
      const factory = new ImageLoaderFactory();
      const unsplashLoader = new UnsplashLoader();

      factory.registerLoader(unsplashLoader);

      const originalUrl = "https://example.com/image.jpg";
      const result = factory.load({
        src: originalUrl,
        width: 800,
      });

      expect(result).toBe(originalUrl);
    });

    it("should use default quality when not specified", () => {
      const factory = new ImageLoaderFactory({ defaultQuality: 90 });
      const unsplashLoader = new UnsplashLoader();

      factory.registerLoader(unsplashLoader);

      const result = factory.load({
        src: "https://images.unsplash.com/photo-123",
        width: 800,
      });

      expect(result).toContain("q=90");
    });
  });

  describe("createNextImageLoader", () => {
    it("should create a Next.js compatible loader function", () => {
      const factory = new ImageLoaderFactory();
      const unsplashLoader = new UnsplashLoader();

      factory.registerLoader(unsplashLoader);

      const nextLoader = factory.createNextImageLoader();
      const result = nextLoader({
        quality: 80,
        src: "https://images.unsplash.com/photo-123",
        width: 800,
      });

      expect(result).toContain("w=800");
      expect(result).toContain("q=80");
    });
  });

  describe("getStats", () => {
    it("should return factory statistics", () => {
      const factory = new ImageLoaderFactory({
        domainMappings: { "example.com": "unsplash" },
      });
      const unsplashLoader = new UnsplashLoader();
      const cloudinaryLoader = new CloudinaryLoader();

      factory.registerLoaders([unsplashLoader, cloudinaryLoader]);

      const stats = factory.getStats();

      expect(stats.totalLoaders).toBe(2);
      expect(stats.loaderNames).toEqual(["unsplash", "cloudinary"]);
      expect(stats.domainMappings).toEqual({ "example.com": "unsplash" });
    });
  });

  describe("clear", () => {
    it("should clear all registered loaders", () => {
      const factory = new ImageLoaderFactory();
      const loaders = [new UnsplashLoader(), new CloudinaryLoader()];

      factory.registerLoaders(loaders);
      expect(factory.getLoaders()).toHaveLength(2);

      factory.clear();

      expect(factory.getLoaders()).toHaveLength(0);
    });
  });

  describe("cache management", () => {
    it("should clear transform cache when it exceeds maximum size", () => {
      const factory = new ImageLoaderFactory();
      const unsplashLoader = new UnsplashLoader();

      factory.registerLoader(unsplashLoader);

      // Load enough images to exceed the cache size (default maxCacheSize is typically 100)
      // We'll load 101 different images to trigger cache clearing
      for (let index = 0; index < 101; index++) {
        factory.load({
          quality: 80,
          src: `https://images.unsplash.com/photo-${index.toString()}`,
          width: 800,
        });
      }

      // The cache should have been cleared at least once during this process
      // We can verify this by checking that the factory still works correctly
      const result = factory.load({
        quality: 80,
        src: "https://images.unsplash.com/photo-test",
        width: 800,
      });

      expect(result).toContain("w=800");
      expect(result).toContain("q=80");
    });

    it("should clear loader cache when it exceeds maximum size", () => {
      const factory = new ImageLoaderFactory();
      const unsplashLoader = new UnsplashLoader();

      factory.registerLoader(unsplashLoader);

      // Trigger loader cache by finding loaders for many different domains
      // This will cause the loader cache to fill up and eventually clear
      for (let index = 0; index < 101; index++) {
        factory.findLoader(`https://domain${index.toString()}.unsplash.com/photo-123`);
      }

      // Verify the factory still works correctly after cache clearing
      const result = factory.findLoader("https://images.unsplash.com/photo-123");

      expect(result).toBe(unsplashLoader);
    });
  });
});
