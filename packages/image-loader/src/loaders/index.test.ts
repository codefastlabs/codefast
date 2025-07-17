import * as LoadersModule from "@/loaders/index";

describe("loaders/index exports", () => {
  describe("loader class exports", () => {
    it("should export AWSCloudFrontLoader", () => {
      expect(LoadersModule.AWSCloudFrontLoader).toBeDefined();
      expect(typeof LoadersModule.AWSCloudFrontLoader).toBe("function");

      const loader = new LoadersModule.AWSCloudFrontLoader();

      expect(loader).toBeInstanceOf(LoadersModule.AWSCloudFrontLoader);
      expect(loader.getName()).toBe("aws-cloudfront");
      expect(typeof loader.load).toBe("function");
      expect(typeof loader.canHandle).toBe("function");
    });

    it("should export CloudinaryLoader", () => {
      expect(LoadersModule.CloudinaryLoader).toBeDefined();
      expect(typeof LoadersModule.CloudinaryLoader).toBe("function");

      const loader = new LoadersModule.CloudinaryLoader();

      expect(loader).toBeInstanceOf(LoadersModule.CloudinaryLoader);
      expect(loader.getName()).toBe("cloudinary");
      expect(typeof loader.load).toBe("function");
      expect(typeof loader.canHandle).toBe("function");
    });

    it("should export ImgixLoader", () => {
      expect(LoadersModule.ImgixLoader).toBeDefined();
      expect(typeof LoadersModule.ImgixLoader).toBe("function");

      const loader = new LoadersModule.ImgixLoader();

      expect(loader).toBeInstanceOf(LoadersModule.ImgixLoader);
      expect(loader.getName()).toBe("imgix");
      expect(typeof loader.load).toBe("function");
      expect(typeof loader.canHandle).toBe("function");
    });

    it("should export SupabaseLoader", () => {
      expect(LoadersModule.SupabaseLoader).toBeDefined();
      expect(typeof LoadersModule.SupabaseLoader).toBe("function");

      const loader = new LoadersModule.SupabaseLoader();

      expect(loader).toBeInstanceOf(LoadersModule.SupabaseLoader);
      expect(loader.getName()).toBe("supabase");
      expect(typeof loader.load).toBe("function");
      expect(typeof loader.canHandle).toBe("function");
    });

    it("should export UnsplashLoader", () => {
      expect(LoadersModule.UnsplashLoader).toBeDefined();
      expect(typeof LoadersModule.UnsplashLoader).toBe("function");

      const loader = new LoadersModule.UnsplashLoader();

      expect(loader).toBeInstanceOf(LoadersModule.UnsplashLoader);
      expect(loader.getName()).toBe("unsplash");
      expect(typeof loader.load).toBe("function");
      expect(typeof loader.canHandle).toBe("function");
    });
  });

  describe("loader functionality", () => {
    it("should export loaders that can handle their respective CDN URLs", () => {
      const awsLoader = new LoadersModule.AWSCloudFrontLoader();
      const cloudinaryLoader = new LoadersModule.CloudinaryLoader();
      const imgixLoader = new LoadersModule.ImgixLoader();
      const supabaseLoader = new LoadersModule.SupabaseLoader();
      const unsplashLoader = new LoadersModule.UnsplashLoader();

      // Test URL handling capabilities
      expect(awsLoader.canHandle("https://d123456.cloudfront.net/image.jpg")).toBe(true);
      expect(cloudinaryLoader.canHandle("https://res.cloudinary.com/demo/image/upload/sample.jpg")).toBe(true);
      expect(imgixLoader.canHandle("https://demo.imgix.net/sample.jpg")).toBe(true);
      expect(supabaseLoader.canHandle("https://project.supabase.co/storage/v1/object/public/bucket/sample.jpg")).toBe(
        true,
      );
      expect(unsplashLoader.canHandle("https://images.unsplash.com/photo-123")).toBe(true);

      // Test that loaders don't handle other CDN URLs
      expect(awsLoader.canHandle("https://res.cloudinary.com/demo/image/upload/sample.jpg")).toBe(false);
      expect(cloudinaryLoader.canHandle("https://images.unsplash.com/photo-123")).toBe(false);
      expect(imgixLoader.canHandle("https://d123456.cloudfront.net/image.jpg")).toBe(false);
      expect(supabaseLoader.canHandle("https://demo.imgix.net/sample.jpg")).toBe(false);
      expect(unsplashLoader.canHandle("https://project.supabase.co/storage/v1/object/public/bucket/sample.jpg")).toBe(
        false,
      );
    });

    it("should export loaders that can transform URLs correctly", () => {
      const cloudinaryLoader = new LoadersModule.CloudinaryLoader();
      const imgixLoader = new LoadersModule.ImgixLoader();
      const unsplashLoader = new LoadersModule.UnsplashLoader();

      // Test URL transformation
      const cloudinaryUrl = cloudinaryLoader.load({
        quality: 75,
        src: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        width: 800,
      });

      expect(cloudinaryUrl).toContain("w_800");
      expect(cloudinaryUrl).toContain("q_75");

      const imgixUrl = imgixLoader.load({
        quality: 90,
        src: "https://demo.imgix.net/sample.jpg",
        width: 600,
      });

      expect(imgixUrl).toContain("w=600");
      expect(imgixUrl).toContain("q=90");

      const unsplashUrl = unsplashLoader.load({
        quality: 80,
        src: "https://images.unsplash.com/photo-123",
        width: 400,
      });

      expect(unsplashUrl).toContain("w=400");
      expect(unsplashUrl).toContain("q=80");
    });
  });

  describe("loader uniqueness", () => {
    it("should export loaders with unique names", () => {
      const loaders = [
        new LoadersModule.AWSCloudFrontLoader(),
        new LoadersModule.CloudinaryLoader(),
        new LoadersModule.ImgixLoader(),
        new LoadersModule.SupabaseLoader(),
        new LoadersModule.UnsplashLoader(),
      ];

      const names = loaders.map((loader) => loader.getName());
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(loaders.length);
      expect(names).toEqual(["aws-cloudfront", "cloudinary", "imgix", "supabase", "unsplash"]);
    });

    it("should export independent loader instances", () => {
      const loader1 = new LoadersModule.CloudinaryLoader();
      const loader2 = new LoadersModule.CloudinaryLoader();

      expect(loader1).not.toBe(loader2);
      expect(loader1).toBeInstanceOf(LoadersModule.CloudinaryLoader);
      expect(loader2).toBeInstanceOf(LoadersModule.CloudinaryLoader);
      expect(loader1.getName()).toBe(loader2.getName());
    });
  });

  describe("module completeness", () => {
    it("should export all expected loader classes", () => {
      const expectedLoaders = [
        "AWSCloudFrontLoader",
        "CloudinaryLoader",
        "ImgixLoader",
        "SupabaseLoader",
        "UnsplashLoader",
      ];

      for (const loaderName of expectedLoaders) {
        expect(LoadersModule[loaderName as keyof typeof LoadersModule]).toBeDefined();
        expect(typeof LoadersModule[loaderName as keyof typeof LoadersModule]).toBe("function");
      }
    });

    it("should not export any unexpected properties", () => {
      const expectedKeys = [
        "AWSCloudFrontLoader",
        "CloudinaryLoader",
        "ImgixLoader",
        "SupabaseLoader",
        "UnsplashLoader",
      ];

      const actualKeys = Object.keys(LoadersModule);

      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    });
  });
});
