# Image Loader

Flexible image loader for Next.js supporting multiple CDN providers with automatic optimization and caching for improved performance.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/@codefast/image-loader.svg)](https://www.npmjs.com/package/@codefast/image-loader)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10%2B-blue.svg)](https://pnpm.io/)

## Installation

Install the image loader via pnpm (recommended):

```bash
pnpm add @codefast/image-loader
```

Or using npm:

```bash
npm install @codefast/image-loader
```

**Peer Dependencies**:

Make sure you have installed the peer dependencies:

```bash
pnpm add next
```

**Requirements**:

- Node.js version 20.0.0 or higher
- Next.js version 15.0.0 or higher (optional)
- TypeScript version 5.9.2 or higher (recommended)

## Quick Start

```tsx
import { createDefaultImageLoaderFactory } from "@codefast/image-loader";

// Create a factory with default CDN loaders
const imageLoaderFactory = createDefaultImageLoaderFactory();

// Use in Next.js Image component
function MyComponent() {
  return (
    <Image
      src="https://res.cloudinary.com/demo/image/upload/sample.jpg"
      alt="Example image"
      width={800}
      height={600}
      loader={imageLoaderFactory.load}
    />
  );
}
```

## Usage

### Using Default Factory

The easiest way to get started is with the default factory that includes all built-in CDN loaders:

```tsx
import { createDefaultImageLoaderFactory } from "@codefast/image-loader";

const factory = createDefaultImageLoaderFactory({
  defaultQuality: 80,
  domainMappings: {
    "my-domain.com": "cloudinary"
  }
});

export default factory.load;
```

### Creating Custom Factory

For more control, create your own factory and register specific loaders:

```tsx
import { 
  ImageLoaderFactory, 
  CloudinaryLoader, 
  ImgixLoader 
} from "@codefast/image-loader";

const factory = new ImageLoaderFactory({
  defaultQuality: 75
});

// Register only the loaders you need
factory.registerLoaders([
  new CloudinaryLoader(),
  new ImgixLoader()
]);

export default factory.load;
```

### Using Individual Loaders

You can also use individual CDN loaders directly:

```tsx
import { CloudinaryLoader } from "@codefast/image-loader";

const cloudinaryLoader = new CloudinaryLoader();

// Use directly with Next.js Image
function CloudinaryImage() {
  return (
    <Image
      src="https://res.cloudinary.com/demo/image/upload/sample.jpg"
      alt="Cloudinary image"
      width={800}
      height={600}
      loader={cloudinaryLoader.load}
    />
  );
}
```

### Configuration with Domain Mappings

Map specific domains to preferred loaders:

```tsx
import { createDefaultImageLoaderFactory } from "@codefast/image-loader";

const factory = createDefaultImageLoaderFactory({
  defaultQuality: 85,
  domainMappings: {
    "images.unsplash.com": "unsplash",
    "cdn.example.com": "aws-cloudfront",
    "res.cloudinary.com": "cloudinary"
  }
});
```

### Custom Loader Implementation

Create your own custom loader by implementing the ImageLoader interface:

```tsx
import { BaseImageLoader } from "@codefast/image-loader";
import type { ImageLoaderProps } from "next/image";

class CustomCDNLoader extends BaseImageLoader {
  getName(): string {
    return "custom-cdn";
  }

  canHandle(src: string): boolean {
    return src.includes("custom-cdn.com");
  }

  load({ src, width, quality }: ImageLoaderProps): string {
    const url = new URL(src);
    url.searchParams.set("w", width.toString());
    url.searchParams.set("q", (quality || 75).toString());
    return url.toString();
  }
}

// Register with factory
const factory = new ImageLoaderFactory();
factory.registerLoader(new CustomCDNLoader());
```

## Supported CDN Providers

The image loader comes with built-in support for the following CDN providers:

- **AWS CloudFront** - Amazon's content delivery network
- **Cloudinary** - Media management and optimization platform  
- **Imgix** - Real-time image processing and optimization
- **Supabase** - Open-source Firebase alternative with storage
- **Unsplash** - Stock photography platform

## Props and Configuration

### ImageLoaderFactoryConfig

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultQuality` | `number` | `75` | Default image quality when not specified |
| `domainMappings` | `Record<string, string>` | `undefined` | Map domains to specific loader names |

### ImageLoaderProps (Next.js)

| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Source URL of the image |
| `width` | `number` | Target width for the image |
| `quality` | `number` | Image quality (1-100) |

## API Reference

### `ImageLoaderFactory`

Main factory class for managing and selecting image loaders.

```typescript
interface ImageLoaderFactoryMethods {
  constructor(config?: ImageLoaderFactoryConfig): ImageLoaderFactory;
  registerLoader(loader: ImageLoader): void;
  registerLoaders(loaders: ImageLoader[]): void;
  unregisterLoader(name: string): boolean;
  getLoaders(): readonly ImageLoader[];
  findLoader(source: string): ImageLoader | null;
  load(config: ImageLoaderProps): string;
  clearCache(): void;
}
```

### `ImageLoader` Interface

Base interface that all loaders must implement:

```typescript
interface ImageLoader {
  load(config: ImageLoaderProps): string;
  canHandle(source: string): boolean;
  getName(): string;
}
```

### `BaseImageLoader`

Abstract base class for creating custom loaders:

```typescript
interface BaseImageLoaderMethods {
  getName(): string;
  canHandle(src: string): boolean;
  load(config: ImageLoaderProps): string;
  extractDomain(url: string): string;
  buildUrl(baseUrl: string, params: Record<string, string>): string;
}
```

### Built-in Loaders

Each CDN provider has its own loader class:

- `AWSCloudFrontLoader` - For AWS CloudFront URLs
- `CloudinaryLoader` - For Cloudinary URLs  
- `ImgixLoader` - For Imgix URLs
- `SupabaseLoader` - For Supabase storage URLs
- `UnsplashLoader` - For Unsplash image URLs

### Utility Functions

```typescript
// Create factory with all default loaders registered
type CreateDefaultImageLoaderFactory = (config?: ImageLoaderFactoryConfig) => ImageLoaderFactory;

// Register all built-in loaders to an existing factory
type RegisterDefaultLoaders = (factory: ImageLoaderFactory) => void;

// Get the default factory instance (singleton)
declare const defaultImageLoaderFactory: ImageLoaderFactory;
```

## Performance Features

- **Caching**: Automatic caching of loader selections and URL transformations
- **Memoization**: Repeated URL transformations are cached for better performance
- **Lazy Loading**: Loaders are only instantiated when needed
- **Domain Optimization**: Fast domain-based loader selection

## Next.js Integration

### next.config.js

Configure the image loader in your Next.js configuration:

```javascript
import { createDefaultImageLoaderFactory } from "@codefast/image-loader";

const factory = createDefaultImageLoaderFactory();

const nextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./image-loader.js",
  },
};

export default nextConfig;
```

### image-loader.js

Create a loader file in your project root:

```javascript
import { createDefaultImageLoaderFactory } from "@codefast/image-loader";

const factory = createDefaultImageLoaderFactory({
  defaultQuality: 80,
});

export default factory.load;
```

## TypeScript Support

The package is built with TypeScript and includes comprehensive type definitions. All interfaces and types are exported for use in your applications:

```typescript
import type { 
  ImageLoader, 
  ImageLoaderFactoryConfig, 
  CDNProvider 
} from "@codefast/image-loader";
```

## Contributing

We welcome all contributions! To get started with development:

### Environment Setup

1. Fork this repository.
2. Clone to your machine: `git clone <your-fork-url>`
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b feature/feature-name`

### Development Workflow

```bash
# Build all packages
pnpm build:packages

# Development mode for image-loader
pnpm dev --filter=@codefast/image-loader

# Run tests
pnpm test --filter=@codefast/image-loader

# Run tests with coverage
pnpm test:coverage --filter=@codefast/image-loader

# Lint and format
pnpm lint:fix
pnpm format
```

5. Commit and submit a pull request.

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Contact

- npm: [@codefast/image-loader](https://www.npmjs.com/package/@codefast/image-loader)
- GitHub: [codefastlabs/codefast](https://github.com/codefastlabs/codefast)
- Issues: [GitHub Issues](https://github.com/codefastlabs/codefast/issues)
- Documentation: [Component Docs](https://codefast.dev/docs/packages/image-loader)

## Architecture

This package follows SOLID principles:

- **Single Responsibility Principle**: Each loader handles one CDN provider
- **Open/Closed Principle**: New loaders can be added without modifying existing code
- **Liskov Substitution Principle**: All loaders are interchangeable through the ImageLoader interface
- **Interface Segregation Principle**: Clean, focused interfaces for different concerns
- **Dependency Inversion Principle**: Factory depends on abstractions, not implementations

The codebase uses modern TypeScript features and includes comprehensive test coverage for reliability and maintainability.
