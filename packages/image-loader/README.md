# @codefast/image-loader

Simple, functional image loader for Next.js supporting multiple CDN providers. Automatically detects and optimizes images from popular CDNs.

## ✨ Features

- 🚀 **Automatic CDN Detection**: Automatically recognizes and optimizes images from 16+ CDN providers
- 🎯 **Zero Configuration**: Use out of the box without any setup
- 🔧 **Flexible Customization**: Easily create custom loaders for your own CDNs
- 📦 **Tree-shakable**: Supports tree-shaking to reduce bundle size
- 🛡️ **Type-safe**: Full TypeScript types included
- ⚡ **High Performance**: URL caching for optimal performance

## 📦 Installation

```bash
npm install @codefast/image-loader
# or
pnpm add @codefast/image-loader
# or
yarn add @codefast/image-loader
```

## 🚀 Quick Start

### Next.js Configuration

Configure in `next.config.ts`:

```typescript
import type { NextConfig } from 'next';
import { imageLoader } from '@codefast/image-loader';

const nextConfig: NextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },
};

export default nextConfig;
```

### Create Loader File

Create `src/lib/image-loader.ts`:

```typescript
import { imageLoader } from '@codefast/image-loader';

export default imageLoader;
```

### Use in Component

```tsx
import Image from 'next/image';

export default function MyComponent() {
  return (
    <Image
      src="https://res.cloudinary.com/demo/image/upload/sample.jpg"
      alt="Sample"
      width={800}
      height={600}
    />
  );
}
```

## 🎯 Supported CDNs

The library automatically supports the following CDN providers:

- **Cloudinary** (`cloudinary.com`)
- **Imgix** (`imgix.net`)
- **Cloudflare Images** (`cloudflare.com`, `/cdn-cgi/image/`)
- **AWS CloudFront** (`cloudfront.net`)
- **Supabase Storage** (`supabase.co`)
- **Contentful** (`ctfassets.net`)
- **ImageKit** (`imagekit.io`)
- **Sanity** (`cdn.sanity.io`)
- **Pixelbin** (`pixelbin.io`)
- **Fastly** (`fastly.com`, `fastlylb.net`)
- **Gumlet** (`gumlet.io`)
- **ImageEngine** (`imageengine.io`, `imgeng`)
- **Sirv** (`sirv.com`)
- **Thumbor** (path contains `thumbor`)
- **Unsplash** (`images.unsplash.com`)
- **Static/Local images** (paths starting with `/`)

## 📚 API Reference

### `imageLoader`

Default loader with all built-in loaders.

```typescript
import { imageLoader } from '@codefast/image-loader';

// Use directly
const optimizedUrl = imageLoader({
  src: 'https://example.com/image.jpg',
  width: 800,
  quality: 75,
});
```

### `createCustomImageLoader`

Create a custom loader with your own configuration.

```typescript
import { createCustomImageLoader } from '@codefast/image-loader';
import type { LoaderConfig } from '@codefast/image-loader';

const customLoader = createCustomImageLoader({
  loaders: [
    {
      loader: myCustomLoader,
      matcher: (src) => src.includes('my-cdn.com'),
    },
  ],
  fallbackLoader: (params) => params.src, // Optional
});
```

### `createImageLoader`

Create an instance of the `ImageLoader` class.

```typescript
import { createImageLoader } from '@codefast/image-loader';
import type { LoaderConfig } from '@codefast/image-loader';

const loader = createImageLoader([
  {
    loader: myLoader,
    matcher: (src) => src.startsWith('https://'),
  },
]);

const url = loader.transform({ src: '...', width: 800 });
```

### `ImageLoader` Class

Main class for handling image transformation.

```typescript
import { ImageLoader } from '@codefast/image-loader';

const loader = new ImageLoader(
  [
    {
      loader: myLoader,
      matcher: (src) => src.includes('example.com'),
    },
  ],
  fallbackLoader // Optional
);

const url = loader.transform({ src: '...', width: 800 });
```

## 🔧 Advanced Usage

### Custom Loader

Create a custom loader for your own CDN:

```typescript
import type { ImageLoaderProps } from 'next/image';
import { DEFAULT_IMAGE_QUALITY } from '@codefast/image-loader';
import { urlCache } from '@codefast/image-loader/utils/url-cache';

export function myCustomLoader({
  src,
  width,
  quality = DEFAULT_IMAGE_QUALITY,
}: ImageLoaderProps): string {
  const url = urlCache.getClone(src);
  
  if (!url) {
    return src;
  }

  // Add transformation parameters
  url.searchParams.set('w', width.toString());
  url.searchParams.set('q', quality.toString());
  
  return url.toString();
}
```

### Using Custom Matcher

```typescript
import { createCustomImageLoader } from '@codefast/image-loader';
import { isDomainMatch } from '@codefast/image-loader';

const loader = createCustomImageLoader({
  loaders: [
    {
      loader: myCustomLoader,
      matcher: (src) => isDomainMatch(src, 'my-cdn.com'),
    },
  ],
});
```

### Import Individual Loaders

You can import individual loaders:

```typescript
import { cloudinaryLoader } from '@codefast/image-loader/loaders/cloudinary';
import { imgixLoader } from '@codefast/image-loader/loaders/imgix';
```

### Utilities

#### `isDomainMatch`

Check if a URL matches a domain.

```typescript
import { isDomainMatch } from '@codefast/image-loader';

isDomainMatch('https://example.com/image.jpg', 'example.com'); // true
isDomainMatch('https://sub.example.com/image.jpg', 'example.com'); // true
```

#### `isPathMatch`

Check if a URL path contains a substring.

```typescript
import { isPathMatch } from '@codefast/image-loader';

isPathMatch('https://example.com/cdn/image.jpg', 'cdn'); // true
```

## 📖 Types

```typescript
import type { LoaderFunction, LoaderConfig } from '@codefast/image-loader';

// LoaderFunction: (params: ImageLoaderProps) => string
// LoaderConfig: { loader: LoaderFunction; matcher: (src: string) => boolean }
```

## 🎨 Constants

```typescript
import { DEFAULT_IMAGE_QUALITY } from '@codefast/image-loader';

// DEFAULT_IMAGE_QUALITY = 75
```

## 🔍 Exports

The library supports multiple entry points for optimal tree-shaking:

- `@codefast/image-loader` - Main exports
- `@codefast/image-loader/core/image-loader` - Core ImageLoader class
- `@codefast/image-loader/core/loader-registry` - Built-in loader configs
- `@codefast/image-loader/loaders/*` - Individual loaders
- `@codefast/image-loader/utils/*` - Utility functions
- `@codefast/image-loader/constants` - Constants
- `@codefast/image-loader/types` - TypeScript types

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [CodeFast Labs](https://github.com/codefastlabs)

## 🔗 Links

- [GitHub Repository](https://github.com/codefastlabs/codefast)
- [Issue Tracker](https://github.com/codefastlabs/codefast/issues)
