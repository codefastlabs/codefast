import * as ImageLoaderModule from "@/index";

describe("index exports", () => {
  describe("type exports", () => {
    it("should export CDNProvider type", () => {
      // Test that CDNProvider type is available (compile-time check)
      const provider: ImageLoaderModule.CDNProvider = "cloudinary";

      expect(provider).toBe("cloudinary");
    });

    it("should export ImageLoader interface", () => {
      // Test that ImageLoader interface is available (compile-time check)
      const mockLoader: ImageLoaderModule.ImageLoader = {
        canHandle: jest.fn(),
        getName: jest.fn(),
        load: jest.fn(),
      };

      expect(mockLoader).toBeDefined();
      expect(typeof mockLoader.load).toBe("function");
      expect(typeof mockLoader.canHandle).toBe("function");
      expect(typeof mockLoader.getName).toBe("function");
    });

    it("should export ImageLoaderFactoryConfig interface", () => {
      // Test that ImageLoaderFactoryConfig interface is available (compile-time check)
      const config: ImageLoaderModule.ImageLoaderFactoryConfig = {
        defaultQuality: 80,
        domainMappings: { "example.com": "cdn.example.com" },
      };

      expect(config.defaultQuality).toBe(80);
      expect(config.domainMappings).toEqual({ "example.com": "cdn.example.com" });
    });
  });

  describe("class exports", () => {
    it("should export BaseImageLoader", () => {
      expect(ImageLoaderModule.BaseImageLoader).toBeDefined();
      expect(typeof ImageLoaderModule.BaseImageLoader).toBe("function");
    });

    it("should export ImageLoaderFactory", () => {
      expect(ImageLoaderModule.ImageLoaderFactory).toBeDefined();
      expect(typeof ImageLoaderModule.ImageLoaderFactory).toBe("function");

      const factory = new ImageLoaderModule.ImageLoaderFactory();

      expect(factory).toBeInstanceOf(ImageLoaderModule.ImageLoaderFactory);
    });

    it("should export defaultImageLoaderFactory", () => {
      expect(ImageLoaderModule.defaultImageLoaderFactory).toBeDefined();
      expect(ImageLoaderModule.defaultImageLoaderFactory).toBeInstanceOf(ImageLoaderModule.ImageLoaderFactory);
    });
  });

  describe("loader exports", () => {
    it("should export AWSCloudFrontLoader", () => {
      expect(ImageLoaderModule.AWSCloudFrontLoader).toBeDefined();
      expect(typeof ImageLoaderModule.AWSCloudFrontLoader).toBe("function");

      const loader = new ImageLoaderModule.AWSCloudFrontLoader();

      expect(loader).toBeInstanceOf(ImageLoaderModule.AWSCloudFrontLoader);
      expect(loader.getName()).toBe("aws-cloudfront");
    });

    it("should export CloudinaryLoader", () => {
      expect(ImageLoaderModule.CloudinaryLoader).toBeDefined();
      expect(typeof ImageLoaderModule.CloudinaryLoader).toBe("function");

      const loader = new ImageLoaderModule.CloudinaryLoader();

      expect(loader).toBeInstanceOf(ImageLoaderModule.CloudinaryLoader);
      expect(loader.getName()).toBe("cloudinary");
    });

    it("should export ImgixLoader", () => {
      expect(ImageLoaderModule.ImgixLoader).toBeDefined();
      expect(typeof ImageLoaderModule.ImgixLoader).toBe("function");

      const loader = new ImageLoaderModule.ImgixLoader();

      expect(loader).toBeInstanceOf(ImageLoaderModule.ImgixLoader);
      expect(loader.getName()).toBe("imgix");
    });

    it("should export SupabaseLoader", () => {
      expect(ImageLoaderModule.SupabaseLoader).toBeDefined();
      expect(typeof ImageLoaderModule.SupabaseLoader).toBe("function");

      const loader = new ImageLoaderModule.SupabaseLoader();

      expect(loader).toBeInstanceOf(ImageLoaderModule.SupabaseLoader);
      expect(loader.getName()).toBe("supabase");
    });

    it("should export UnsplashLoader", () => {
      expect(ImageLoaderModule.UnsplashLoader).toBeDefined();
      expect(typeof ImageLoaderModule.UnsplashLoader).toBe("function");

      const loader = new ImageLoaderModule.UnsplashLoader();

      expect(loader).toBeInstanceOf(ImageLoaderModule.UnsplashLoader);
      expect(loader.getName()).toBe("unsplash");
    });
  });

  describe("utility function exports", () => {
    it("should export createDefaultImageLoaderFactory", () => {
      expect(ImageLoaderModule.createDefaultImageLoaderFactory).toBeDefined();
      expect(typeof ImageLoaderModule.createDefaultImageLoaderFactory).toBe("function");

      const factory = ImageLoaderModule.createDefaultImageLoaderFactory();

      expect(factory).toBeInstanceOf(ImageLoaderModule.ImageLoaderFactory);
    });

    it("should export registerDefaultLoaders", () => {
      expect(ImageLoaderModule.registerDefaultLoaders).toBeDefined();
      expect(typeof ImageLoaderModule.registerDefaultLoaders).toBe("function");

      const factory = new ImageLoaderModule.ImageLoaderFactory();

      expect(() => {
        ImageLoaderModule.registerDefaultLoaders(factory);
      }).not.toThrow();
    });
  });

  describe("integration test", () => {
    it("should allow creating a working image loader setup", () => {
      // Test that all exports work together
      const factory = ImageLoaderModule.createDefaultImageLoaderFactory();

      // Test loading images from different CDNs
      const cloudinaryUrl = factory.load({
        quality: 75,
        src: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        width: 800,
      });

      expect(cloudinaryUrl).toContain("w_800");
      expect(cloudinaryUrl).toContain("q_75");

      const unsplashUrl = factory.load({
        quality: 90,
        src: "https://images.unsplash.com/photo-123",
        width: 600,
      });

      expect(unsplashUrl).toContain("w=600");
      expect(unsplashUrl).toContain("q=90");
    });

    it("should allow manual loader registration", () => {
      const factory = new ImageLoaderModule.ImageLoaderFactory();
      const cloudinaryLoader = new ImageLoaderModule.CloudinaryLoader();

      factory.registerLoader(cloudinaryLoader);

      const loader = factory.findLoader("https://res.cloudinary.com/demo/image/upload/sample.jpg");

      expect(loader).toBe(cloudinaryLoader);
    });
  });
});
