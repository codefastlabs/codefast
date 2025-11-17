import type { ImageLoaderProps } from "next/image";

export type LoaderFunction = (params: ImageLoaderProps) => string;

export interface LoaderConfig {
  domain?: string;
  loader: LoaderFunction;
  matcher: (src: string) => boolean;
  name: string;
}

