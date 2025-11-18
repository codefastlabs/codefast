import type { ImageLoaderProps } from 'next/image';

export type LoaderFunction = (params: ImageLoaderProps) => string;

export interface LoaderConfig {
  loader: LoaderFunction;
  matcher: (src: string) => boolean;
}
