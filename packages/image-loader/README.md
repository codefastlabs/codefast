# @codefast/image-loader

A flexible and extensible image loader library for Next.js applications, designed with SOLID principles to support multiple CDN providers with automatic URL optimization.

## Features

- 🚀 **Next.js 15+ Compatible** - Seamless integration with Next.js Image component
- 🏗️ **SOLID Architecture** - Built following SOLID principles for maintainability and extensibility
- 🔌 **Multiple CDN Support** - Pre-built loaders for popular CDN providers
- 🎯 **Automatic Detection** - Automatically selects the appropriate loader based on URL patterns
- 🛠️ **Extensible** - Easy to add custom loaders for any CDN provider
- 📦 **TypeScript First** - Full TypeScript support with comprehensive type definitions
- ⚡ **Performance Optimized** - Efficient URL transformation with minimal overhead
- 🧪 **Well Tested** - Comprehensive test coverage for reliability

## Supported CDN Providers

- **Unsplash** (`images.unsplash.com`)
- **Cloudinary** (`*.cloudinary.com`)
- **Imgix** (`*.imgix.net`)
- **AWS CloudFront** (`*.cloudfront.net`)
- **Supabase Storage** (`*.supabase.co`)

## Installation

```bash
# Using pnpm (recommended)
pnpm add @codefast/image-loader

# Using npm
npm install @codefast/image-loader

# Using yarn
yarn add @codefast/image-loader
```

### Dependencies

This package has the following dependencies:
- `query-string`: ^7.1.3 (for URL parameter manipulation)

### Peer Dependencies

This package requires Next.js 15.4.1 or higher:

```bash
pnpm add next@^15.4.1
```

## Quick Start

### 1. Create Image Loader File

Create `src/lib/image-loader.ts` in your Next.js project:

```typescript
import { createDefaultImageLoaderFactory } from "@codefast/image-loader";
import type { ImageLoaderProps } from "@codefast/image-loader";

// Create factory with all default loaders
const imageLoaderFactory = createDefaultImageLoaderFactory();

// Export Next.js compatible loader function
export function imageLoader(params: ImageLoaderProps): string {
  return imageLoaderFactory.load(params);
}

export default imageLoader;
```

### 2. Configure Next.js

Update your `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.imgix.net",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
```

### 3. Use in Your Components

```tsx
import Image from "next/image";

export function MyComponent() {
  return (
    <Image
      src="https://images.unsplash.com/photo-1234567890"
      alt="Example image"
      width={800}
      height={600}
      quality={85}
    />
  );
}
```

## API Reference

### Core Types

```typescript
// Uses Next.js ImageLoaderProps directly
import type { ImageLoaderProps } from "next/image";

interface ImageLoader {
  load(config: ImageLoaderProps): string;
  canHandle(source: string): boolean;
  getName(): string;
}

interface ImageLoaderFactoryConfig {
  defaultQuality?: number;
  domainMappings?: Record<string, string>;
}

type CDNProvider = "aws-cloudfront" | "cloudinary" | "imgix" | "supabase" | "unsplash";
```

### ImageLoaderFactory

The main factory class for managing image loaders:

```typescript
import { ImageLoaderFactory } from "@codefast/image-loader";

const factory = new ImageLoaderFactory({
  defaultQuality: 75,
  domainMappings: {
    "my-custom-domain.com": "cloudinary",
  },
});
```

#### Methods

- `registerLoader(loader: ImageLoader)` - Register a new loader
- `registerLoaders(loaders: ImageLoader[])` - Register multiple loaders
- `unregisterLoader(name: string)` - Remove a loader by name
- `getLoaders()` - Get all registered loaders
- `findLoader(src: string)` - Find appropriate loader for URL
- `load(config: ImageLoaderProps)` - Transform image URL
- `createNextImageLoader()` - Create Next.js compatible function
- `getStats()` - Get factory statistics
- `clear()` - Remove all loaders

### BaseImageLoader

Abstract base class for creating custom loaders:

```typescript
import { BaseImageLoader } from "@codefast/image-loader";
import type { ImageLoaderProps } from "next/image";

class MyCustomLoader extends BaseImageLoader {
  constructor(config?: { defaultQuality?: number }) {
    super(config);
  }

  public getName(): string {
    return "my-custom-loader";
  }

  public canHandle(source: string): boolean {
    return this.extractDomain(source) === "cdn.example.com";
  }

  protected transformUrl(config: ImageLoaderProps): string {
    // Your transformation logic here
    const { src, width, quality } = config;
    // Use utility methods like this.buildQueryParams() if needed
    return src; // Return transformed URL
  }
}
```

### Individual Loaders

Each CDN provider has its own loader class:

```typescript
import {
  UnsplashLoader,
  CloudinaryLoader,
  ImgixLoader,
  AWSCloudFrontLoader,
  SupabaseLoader,
} from "@codefast/image-loader";

// Use individual loaders
const unsplashLoader = new UnsplashLoader();
const cloudinaryLoader = new CloudinaryLoader();
```

## Usage Examples

### Basic Usage with Default Setup

```typescript
import { createDefaultImageLoaderFactory } from "@codefast/image-loader";

const factory = createDefaultImageLoaderFactory();

// Transform Unsplash URL
const unsplashUrl = factory.load({
  src: "https://images.unsplash.com/photo-1234567890",
  width: 800,
  quality: 85,
});
// Result: https://images.unsplash.com/photo-1234567890?w=800&q=85&fm=auto&fit=crop

// Transform Cloudinary URL
const cloudinaryUrl = factory.load({
  src: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  width: 600,
  quality: 90,
});
// Result: https://res.cloudinary.com/demo/image/upload/w_600,q_90,f_auto,c_fill/sample.jpg
```

### Custom Configuration

```typescript
import { ImageLoaderFactory, UnsplashLoader, CloudinaryLoader } from "@codefast/image-loader";

const factory = new ImageLoaderFactory({
  defaultQuality: 80,
  domainMappings: {
    "my-cdn.example.com": "cloudinary",
    "images.mysite.com": "unsplash",
  },
});

// Register only specific loaders
factory.registerLoaders([new UnsplashLoader({ defaultQuality: 85 }), new CloudinaryLoader({ defaultQuality: 90 })]);
```

### Creating Custom Loaders

```typescript
import { BaseImageLoader } from "@codefast/image-loader";
import type { ImageLoaderProps } from "next/image";

class MyCustomLoader extends BaseImageLoader {
  public getName(): string {
    return "my-custom-cdn";
  }

  public canHandle(source: string): boolean {
    return this.extractDomain(source) === "cdn.mysite.com";
  }

  protected transformUrl(config: ImageLoaderProps): string {
    const { src, width, quality } = config;

    try {
      const url = new URL(src);

      // Add your custom transformation logic
      url.searchParams.set("w", String(width));
      if (quality) {
        url.searchParams.set("q", String(quality));
      }

      return url.toString();
    } catch (error) {
      console.warn(`Failed to transform custom URL: ${src}`, error);
      return src;
    }
  }
}

// Register your custom loader
const factory = new ImageLoaderFactory();
factory.registerLoader(new MyCustomLoader());
```

### Advanced Usage with Domain Mapping

```typescript
import { ImageLoaderFactory, CloudinaryLoader } from "@codefast/image-loader";

const factory = new ImageLoaderFactory({
  domainMappings: {
    // Map custom domains to specific loaders
    "assets.myapp.com": "cloudinary",
    "media.mysite.com": "imgix",
  },
});

factory.registerLoaders([new CloudinaryLoader(), new ImgixLoader()]);

// URLs from assets.myapp.com will use CloudinaryLoader
const result = factory.load({
  src: "https://assets.myapp.com/image.jpg",
  width: 400,
});
```

### Runtime Loader Management

```typescript
import { createDefaultImageLoaderFactory, UnsplashLoader } from "@codefast/image-loader";

const factory = createDefaultImageLoaderFactory();

// Get factory statistics
console.log(factory.getStats());
// Output: { totalLoaders: 5, loaderNames: ["unsplash", "cloudinary", ...], domainMappings: {} }

// Remove a specific loader
factory.unregisterLoader("unsplash");

// Add it back with custom config
factory.registerLoader(new UnsplashLoader({ defaultQuality: 95 }));

// Clear all loaders and start fresh
factory.clear();
```

## CDN-Specific Examples

### Unsplash

```typescript
// Input: https://images.unsplash.com/photo-1234567890
// Output: https://images.unsplash.com/photo-1234567890?w=800&q=85&fm=auto&fit=crop

const result = factory.load({
  src: "https://images.unsplash.com/photo-1234567890",
  width: 800,
  quality: 85,
});
```

### Cloudinary

```typescript
// Input: https://res.cloudinary.com/demo/image/upload/sample.jpg
// Output: https://res.cloudinary.com/demo/image/upload/w_800,q_85,f_auto,c_fill/sample.jpg

const result = factory.load({
  src: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  width: 800,
  quality: 85,
});
```

### Imgix

```typescript
// Input: https://demo.imgix.net/image.jpg
// Output: https://demo.imgix.net/image.jpg?w=800&q=85&auto=format,compress&fit=crop&crop=faces,entropy

const result = factory.load({
  src: "https://demo.imgix.net/image.jpg",
  width: 800,
  quality: 85,
});
```

### AWS CloudFront

```typescript
// Input: https://d1234567890.cloudfront.net/image.jpg
// Output: https://d1234567890.cloudfront.net/image.jpg?w=800&q=85&f=auto&fit=cover

const result = factory.load({
  src: "https://d1234567890.cloudfront.net/image.jpg",
  width: 800,
  quality: 85,
});
```

### Supabase Storage

```typescript
// Input: https://project.supabase.co/storage/v1/object/bucket/image.jpg
// Output: https://project.supabase.co/storage/v1/object/bucket/image.jpg?width=800&quality=85&format=auto&resize=cover

const result = factory.load({
  src: "https://project.supabase.co/storage/v1/object/bucket/image.jpg",
  width: 800,
  quality: 85,
});
```

## Integration Patterns

### React Hook Pattern

```tsx
import { useMemo } from "react";
import { createDefaultImageLoaderFactory } from "@codefast/image-loader";

export function useImageLoader() {
  const factory = useMemo(() => createDefaultImageLoaderFactory(), []);

  return {
    loadImage: factory.load.bind(factory),
    getStats: factory.getStats.bind(factory),
    findLoader: factory.findLoader.bind(factory),
  };
}

// Usage in component
function MyComponent() {
  const { loadImage } = useImageLoader();

  const optimizedUrl = loadImage({
    src: "https://images.unsplash.com/photo-123",
    width: 400,
    quality: 80,
  });

  return <img src={optimizedUrl} alt="Optimized" />;
}
```

### Context Provider Pattern

```tsx
import { createContext, useContext, ReactNode } from "react";
import { createDefaultImageLoaderFactory, ImageLoaderFactory } from "@codefast/image-loader";

const ImageLoaderContext = createContext<ImageLoaderFactory | null>(null);

export function ImageLoaderProvider({ children }: { children: ReactNode }) {
  const factory = useMemo(() => createDefaultImageLoaderFactory(), []);

  return <ImageLoaderContext.Provider value={factory}>{children}</ImageLoaderContext.Provider>;
}

export function useImageLoaderContext() {
  const context = useContext(ImageLoaderContext);
  if (!context) {
    throw new Error("useImageLoaderContext must be used within ImageLoaderProvider");
  }
  return context;
}
```

## Error Handling

The library includes built-in error handling:

```typescript
// Invalid URLs return the original URL with a warning
const result = factory.load({
  src: "https://unknown-cdn.com/image.jpg",
  width: 800,
});
// Console warning: "No loader found for URL: https://unknown-cdn.com/image.jpg. Returning original URL."
// Result: "https://unknown-cdn.com/image.jpg"

// Invalid parameters throw errors
try {
  factory.load({
    src: "https://images.unsplash.com/photo-123",
    width: 0, // Invalid width
  });
} catch (error) {
  console.error(error.message); // "Image width must be a positive number"
}
```

## Testing

The library includes comprehensive test utilities:

```typescript
import { ImageLoaderFactory, UnsplashLoader } from "@codefast/image-loader";

describe("Image Loader Tests", () => {
  let factory: ImageLoaderFactory;

  beforeEach(() => {
    factory = new ImageLoaderFactory();
    factory.registerLoader(new UnsplashLoader());
  });

  it("should transform Unsplash URLs correctly", () => {
    const result = factory.load({
      src: "https://images.unsplash.com/photo-123",
      width: 800,
      quality: 85,
    });

    expect(result).toContain("w=800");
    expect(result).toContain("q=85");
  });
});
```

## Performance Considerations

- **Lazy Loading**: Loaders are instantiated only when needed
- **Caching**: URL transformations are stateless and can be cached
- **Memory Efficient**: Factory pattern minimizes memory usage
- **Fast Lookup**: Domain-based loader selection is O(1) with domain mappings

## Migration Guide

### From Built-in Next.js Loaders

```typescript
// Before (next.config.js)
module.exports = {
  images: {
    loader: "cloudinary",
    path: "https://res.cloudinary.com/demo/image/upload/",
  },
};

// After (next.config.ts + image-loader.ts)
const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
};

// src/lib/image-loader.ts
import { ImageLoaderFactory, CloudinaryLoader } from "@codefast/image-loader";

const factory = new ImageLoaderFactory();
factory.registerLoader(new CloudinaryLoader());

export default factory.createNextImageLoader();
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/codefastlabs/codefast.git
cd codefast

# Install dependencies
pnpm install

# Build the package
cd packages/image-loader
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Adding New CDN Loaders

1. Create a new loader class extending `BaseImageLoader`
2. Implement the required abstract methods
3. Add comprehensive tests
4. Update documentation
5. Submit a pull request

Example:

```typescript
// src/loaders/my-cdn-loader.ts
import { BaseImageLoader } from "@/base-loader";
import type { ImageLoaderProps } from "next/image";

export class MyCDNLoader extends BaseImageLoader {
  private static readonly DOMAIN = "cdn.example.com";
  private static readonly NAME = "my-cdn";

  public getName(): string {
    return MyCDNLoader.NAME;
  }

  public canHandle(source: string): boolean {
    return this.extractDomain(source) === MyCDNLoader.DOMAIN;
  }

  protected transformUrl(config: ImageLoaderProps): string {
    const { src, width, quality } = config;

    try {
      const url = new URL(src);
      url.searchParams.set("w", String(width));
      if (quality) {
        url.searchParams.set("q", String(quality));
      }
      return url.toString();
    } catch (error) {
      console.warn(`Failed to transform URL: ${src}`, error);
      return src;
    }
  }
}
```

## Troubleshooting

### Common Issues

**Q: Images not loading with custom loader**
A: Ensure your domain is added to `remotePatterns` in `next.config.ts`

**Q: TypeScript errors with ImageLoaderProps**
A: Make sure you're importing the type from `@codefast/image-loader`, not Next.js

**Q: Loader not found warnings**
A: Check that the URL domain matches the loader's `canHandle` method or add domain mappings

**Q: Build errors with Next.js**
A: Ensure Next.js 15.4.1+ is installed and the loader file path is correct

### Debug Mode

Enable debug logging:

```typescript
const factory = createDefaultImageLoaderFactory();

// Log all transformations
const originalLoad = factory.load.bind(factory);
factory.load = (config) => {
  const result = originalLoad(config);
  console.log(`Transformed ${config.src} -> ${result}`);
  return result;
};
```

## License

MIT © [CodeFast Labs](https://github.com/codefastlabs)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Made with ❤️ by the CodeFast team**

For more information, visit our [documentation site](https://codefast.dev) or check out the [source code](https://github.com/codefastlabs/codefast/tree/main/packages/image-loader).
