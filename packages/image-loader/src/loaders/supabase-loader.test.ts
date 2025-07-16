import { SupabaseLoader } from "@/loaders/supabase-loader";

describe("SupabaseLoader", () => {
  const loader = new SupabaseLoader();

  describe("getName", () => {
    it("should return the correct loader name", () => {
      expect(loader.getName()).toBe("supabase");
    });
  });

  describe("canHandle", () => {
    it("should handle *.supabase.co URLs with /storage/v1/ path", () => {
      expect(loader.canHandle("https://project.supabase.co/storage/v1/object/bucket/image.jpg")).toBe(true);
      expect(loader.canHandle("https://my-project.supabase.co/storage/v1/object/public/images/photo.jpg")).toBe(true);
    });

    it("should not handle *.supabase.co URLs without /storage/v1/ path", () => {
      expect(loader.canHandle("https://project.supabase.co/api/v1/image.jpg")).toBe(false);
      expect(loader.canHandle("https://project.supabase.co/image.jpg")).toBe(false);
    });

    it("should not handle other domains", () => {
      expect(loader.canHandle("https://example.com/storage/v1/image.jpg")).toBe(false);
      expect(loader.canHandle("https://images.unsplash.com/photo-123")).toBe(false);
      expect(loader.canHandle("https://res.cloudinary.com/demo/image.jpg")).toBe(false);
      expect(loader.canHandle("https://demo.imgix.net/image.jpg")).toBe(false);
    });

    it("should not handle URLs without protocol", () => {
      expect(loader.canHandle("project.supabase.co/storage/v1/object/bucket/image.jpg")).toBe(false);
    });
  });

  describe("load", () => {
    it("should transform Supabase URLs with width and quality", () => {
      const result = loader.load({
        quality: 80,
        src: "https://project.supabase.co/storage/v1/object/bucket/image.jpg",
        width: 800,
      });

      expect(result).toContain("width=800");
      expect(result).toContain("quality=80");
      expect(result).toContain("format=auto");
      expect(result).toContain("resize=cover");
    });

    it("should use default quality when not specified", () => {
      const result = loader.load({
        src: "https://project.supabase.co/storage/v1/object/bucket/image.jpg",
        width: 800,
      });

      expect(result).toContain("width=800");
      expect(result).toContain("quality=75"); // default quality
      expect(result).toContain("format=auto");
      expect(result).toContain("resize=cover");
    });

    it("should preserve existing query parameters", () => {
      const result = loader.load({
        quality: 90,
        src: "https://project.supabase.co/storage/v1/object/bucket/image.jpg?existing=param",
        width: 600,
      });

      expect(result).toContain("existing=param");
      expect(result).toContain("width=600");
      expect(result).toContain("quality=90");
    });

    it("should handle URLs with public bucket paths", () => {
      const result = loader.load({
        quality: 85,
        src: "https://project.supabase.co/storage/v1/object/public/images/photo.jpg",
        width: 1200,
      });

      expect(result).toContain("public/images/photo.jpg");
      expect(result).toContain("width=1200");
      expect(result).toContain("quality=85");
    });

    it("should handle different quality values", () => {
      const result = loader.load({
        quality: 50,
        src: "https://project.supabase.co/storage/v1/object/bucket/image.jpg",
        width: 400,
      });

      expect(result).toContain("width=400");
      expect(result).toContain("quality=50");
    });

    it("should handle malformed URLs by appending query parameters", () => {
      const malformedUrl = "not-a-valid-url";
      const result = loader.load({
        src: malformedUrl,
        width: 800,
      });

      expect(result).toContain(malformedUrl);
      expect(result).toContain("width=800");
      expect(result).toContain("quality=75");
    });

    it("should throw error for invalid width", () => {
      expect(() => {
        loader.load({
          src: "https://project.supabase.co/storage/v1/object/bucket/image.jpg",
          width: 0,
        });
      }).toThrow("Image width must be a positive number");
    });

    it("should throw error for invalid quality", () => {
      expect(() => {
        loader.load({
          quality: 101,
          src: "https://project.supabase.co/storage/v1/object/bucket/image.jpg",
          width: 800,
        });
      }).toThrow("Image quality must be between 1 and 100");
    });

    it("should throw error for empty src", () => {
      expect(() => {
        loader.load({
          src: "",
          width: 800,
        });
      }).toThrow("Image source URL is required");
    });
  });
});
