import queryString from "query-string";

import { UnsplashLoader } from "@/loaders/unsplash-loader";

// Mock the query-string module
jest.mock("query-string", () => ({
  __esModule: true,
  default: {
    stringifyUrl: jest.fn(),
  },
}));

const mockedQueryString = queryString as jest.Mocked<typeof queryString>;

describe("UnsplashLoader", () => {
  const loader = new UnsplashLoader();

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
      expect(loader.getName()).toBe("unsplash");
    });
  });

  describe("canHandle", () => {
    it("should handle images.unsplash.com URLs", () => {
      expect(loader.canHandle("https://images.unsplash.com/photo-123")).toBe(true);
    });

    it("should not handle other domains", () => {
      expect(loader.canHandle("https://example.com/image.jpg")).toBe(false);
      expect(loader.canHandle("https://cloudinary.com/image.jpg")).toBe(false);
    });

    it("should not handle URLs without protocol", () => {
      expect(loader.canHandle("images.unsplash.com/photo-123")).toBe(false);
    });
  });

  describe("load", () => {
    it("should transform Unsplash URLs with width and quality", () => {
      const result = loader.load({
        quality: 80,
        src: "https://images.unsplash.com/photo-123",
        width: 800,
      });

      expect(result).toContain("w=800");
      expect(result).toContain("q=80");
      expect(result).toContain("fm=auto");
      expect(result).toContain("fit=crop");
    });

    it("should use default quality when not specified", () => {
      const result = loader.load({
        src: "https://images.unsplash.com/photo-123",
        width: 800,
      });

      expect(result).toContain("w=800");
      expect(result).toContain("q=75"); // default quality
      expect(result).toContain("fm=auto");
      expect(result).toContain("fit=crop");
    });

    it("should preserve existing query parameters", () => {
      const result = loader.load({
        quality: 90,
        src: "https://images.unsplash.com/photo-123?ixid=existing",
        width: 800,
      });

      expect(result).toContain("ixid=existing");
      expect(result).toContain("w=800");
      expect(result).toContain("q=90");
    });

    it("should throw error for invalid width", () => {
      expect(() => {
        loader.load({
          src: "https://images.unsplash.com/photo-123",
          width: 0,
        });
      }).toThrow("Image width must be a positive number");
    });

    it("should throw error for invalid quality", () => {
      expect(() => {
        loader.load({
          quality: 101,
          src: "https://images.unsplash.com/photo-123",
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

      const testSource = "https://images.unsplash.com/photo-123";
      const result = loader.load({
        src: testSource,
        width: 800,
      });

      expect(result).toBe(testSource);
      expect(consoleSpy).toHaveBeenCalledWith(
        `Failed to transform Unsplash URL: ${testSource}`,
        expect.any(Error),
      );

      // Clean up
      consoleSpy.mockRestore();
    });
  });
});
