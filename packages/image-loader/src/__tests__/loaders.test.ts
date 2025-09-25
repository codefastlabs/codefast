import {
  awsCloudFrontLoader,
  cloudinaryLoader,
  imgixLoader,
  supabaseLoader,
  unsplashLoader,
} from "../loaders";

describe("Individual Loaders", () => {
  describe("cloudinaryLoader", () => {
    it("should transform Cloudinary URLs correctly", () => {
      const config = {
        quality: 75,
        src: "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg",
        width: 800,
      };

      const result = cloudinaryLoader(config);

      expect(result).toContain("w_800");
      expect(result).toContain("q_75");
      expect(result).toContain("f_auto");
      expect(result).toContain("c_fill");
    });

    it("should handle invalid Cloudinary URLs", () => {
      const config = {
        quality: 75,
        src: "https://res.cloudinary.com/demo/invalid/path/sample.jpg",
        width: 800,
      };

      const result = cloudinaryLoader(config);

      expect(result).toBe(config.src);
    });
  });

  describe("unsplashLoader", () => {
    it("should transform Unsplash URLs correctly", () => {
      const config = {
        quality: 80,
        src: "https://images.unsplash.com/photo-1234567890",
        width: 600,
      };

      const result = unsplashLoader(config);

      expect(result).toContain("w=600");
      expect(result).toContain("q=80");
      expect(result).toContain("fm=auto");
      expect(result).toContain("fit=crop");
    });
  });

  describe("imgixLoader", () => {
    it("should transform Imgix URLs correctly", () => {
      const config = {
        quality: 85,
        src: "https://example.imgix.net/image.jpg",
        width: 400,
      };

      const result = imgixLoader(config);

      expect(result).toContain("w=400");
      expect(result).toContain("q=85");
      expect(result).toContain("auto=format");
    });
  });

  describe("awsCloudFrontLoader", () => {
    it("should transform AWS CloudFront URLs correctly", () => {
      const config = {
        quality: 90,
        src: "https://d1234567890.cloudfront.net/image.jpg",
        width: 300,
      };

      const result = awsCloudFrontLoader(config);

      expect(result).toContain("w=300");
      expect(result).toContain("q=90");
      expect(result).toContain("f=auto");
    });
  });

  describe("supabaseLoader", () => {
    it("should transform Supabase URLs correctly", () => {
      const config = {
        quality: 70,
        src: "https://xyz.supabase.co/storage/v1/object/public/bucket/image.jpg",
        width: 500,
      };

      const result = supabaseLoader(config);

      expect(result).toContain("width=500");
      expect(result).toContain("quality=70");
      expect(result).toContain("format=auto");
    });
  });
});
