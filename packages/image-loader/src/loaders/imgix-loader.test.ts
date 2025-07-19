import queryString from "query-string";

import { ImgixLoader } from "@/loaders/imgix-loader";

// Mock the query-string module
jest.mock("query-string", () => ({
  __esModule: true,
  default: {
    stringifyUrl: jest.fn(),
  },
}));

const mockedQueryString = queryString as jest.Mocked<typeof queryString>;

describe("ImgixLoader", () => {
  const loader = new ImgixLoader();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Set up default mock implementation for stringifyUrl
    mockedQueryString.stringifyUrl.mockImplementation(({ url, query }) => {
      const queryParams = new URLSearchParams(query as Record<string, string>).toString();
      return queryParams ? `${url}?${queryParams}` : url;
    });
  });

  describe("getName", () => {
    it("should return the correct loader name", () => {
      expect(loader.getName()).toBe("imgix");
    });
  });

  describe("canHandle", () => {
    it("should handle *.imgix.net URLs", () => {
      expect(loader.canHandle("https://demo.imgix.net/image.jpg")).toBe(true);
      expect(loader.canHandle("https://my-source.imgix.net/path/image.jpg")).toBe(true);
    });

    it("should not handle other domains", () => {
      expect(loader.canHandle("https://example.com/image.jpg")).toBe(false);
      expect(loader.canHandle("https://images.unsplash.com/photo-123")).toBe(false);
      expect(loader.canHandle("https://res.cloudinary.com/demo/image.jpg")).toBe(false);
      expect(loader.canHandle("https://d123456789.cloudfront.net/image.jpg")).toBe(false);
    });

    it("should not handle URLs without protocol", () => {
      expect(loader.canHandle("demo.imgix.net/image.jpg")).toBe(false);
    });
  });

  describe("load", () => {
    it("should transform Imgix URLs with width and quality", () => {
      const result = loader.load({
        quality: 80,
        src: "https://demo.imgix.net/image.jpg",
        width: 800,
      });

      expect(result).toContain("w=800");
      expect(result).toContain("q=80");
      expect(result).toContain("auto=format%2Ccompress");
      expect(result).toContain("crop=faces%2Centropy");
      expect(result).toContain("fit=crop");
    });

    it("should use default quality when not specified", () => {
      const result = loader.load({
        src: "https://demo.imgix.net/image.jpg",
        width: 800,
      });

      expect(result).toContain("w=800");
      expect(result).toContain("q=75"); // default quality
      expect(result).toContain("auto=format%2Ccompress");
      expect(result).toContain("crop=faces%2Centropy");
      expect(result).toContain("fit=crop");
    });

    it("should preserve existing query parameters", () => {
      const result = loader.load({
        quality: 90,
        src: "https://demo.imgix.net/image.jpg?existing=param",
        width: 600,
      });

      expect(result).toContain("existing=param");
      expect(result).toContain("w=600");
      expect(result).toContain("q=90");
    });

    it("should handle URLs with paths", () => {
      const result = loader.load({
        quality: 85,
        src: "https://demo.imgix.net/path/to/image.jpg",
        width: 1200,
      });

      expect(result).toContain("path/to/image.jpg");
      expect(result).toContain("w=1200");
      expect(result).toContain("q=85");
    });

    it("should handle different quality values", () => {
      const result = loader.load({
        quality: 50,
        src: "https://demo.imgix.net/image.jpg",
        width: 400,
      });

      expect(result).toContain("w=400");
      expect(result).toContain("q=50");
    });

    it("should handle malformed URLs by appending query parameters", () => {
      const malformedUrl = "not-a-valid-url";
      const result = loader.load({
        src: malformedUrl,
        width: 800,
      });

      expect(result).toContain(malformedUrl);
      expect(result).toContain("w=800");
      expect(result).toContain("q=75");
    });

    it("should throw error for invalid width", () => {
      expect(() => {
        loader.load({
          src: "https://demo.imgix.net/image.jpg",
          width: 0,
        });
      }).toThrow("Image width must be a positive number");
    });

    it("should throw error for invalid quality", () => {
      expect(() => {
        loader.load({
          quality: 101,
          src: "https://demo.imgix.net/image.jpg",
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

    it("should handle queryString.stringifyUrl errors and return original URL", () => {
      // Mock queryString.stringifyUrl to throw an error
      mockedQueryString.stringifyUrl.mockImplementation(() => {
        throw new Error("Mock queryString error");
      });

      // Spy on console.warn to verify it's called
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {
        // Intentionally empty to suppress console output during tests
      });

      const testSource = "https://demo.imgix.net/image.jpg";
      const result = loader.load({
        src: testSource,
        width: 800,
      });

      expect(result).toBe(testSource);
      expect(consoleSpy).toHaveBeenCalledWith(
        `Failed to transform Imgix URL: ${testSource}`,
        expect.any(Error),
      );

      // Clean up
      consoleSpy.mockRestore();
    });
  });
});
