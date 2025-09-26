import {
  ensureProtocol,
  extractDomain,
} from "../utils";

describe("Utility Functions", () => {
  describe("extractDomain", () => {
    it("should extract domain from valid URLs", () => {
      expect(extractDomain("https://example.com/path")).toBe("example.com");
      expect(extractDomain("http://subdomain.example.com")).toBe("subdomain.example.com");
      expect(extractDomain("https://images.unsplash.com/photo")).toBe("images.unsplash.com");
    });

    it("should return empty string for invalid URLs", () => {
      expect(extractDomain("invalid-url")).toBe("");
      expect(extractDomain("")).toBe("");
    });
  });

  describe("ensureProtocol", () => {
    it("should add https protocol to URLs without protocol", () => {
      expect(ensureProtocol("example.com")).toBe("https://example.com");
      expect(ensureProtocol("images.unsplash.com/photo")).toBe("https://images.unsplash.com/photo");
    });

    it("should handle URLs with // prefix", () => {
      expect(ensureProtocol("//example.com")).toBe("https://example.com");
    });

    it("should not modify URLs with existing protocol", () => {
      expect(ensureProtocol("https://example.com")).toBe("https://example.com");
      expect(ensureProtocol("http://example.com")).toBe("http://example.com");
    });

    it("should use custom default protocol", () => {
      expect(ensureProtocol("example.com", "http")).toBe("http://example.com");
    });
  });
});
