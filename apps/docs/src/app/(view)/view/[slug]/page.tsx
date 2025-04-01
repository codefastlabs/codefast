import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type JSX, cache } from 'react';

import type { RegistryItem } from '@/types/registry';

import { registryBlocks } from '@/registry/registry-blocks';

const getCacheRegistry = cache((component: string): null | RegistryItem => registryBlocks[component]);

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const registry = getCacheRegistry(slug);

  if (!registry) {
    return {};
  }

  const title = registry.title;
  const description = registry.description;

  return {
    title,
    description,
  };
}

export function generateStaticParams(): { slug: string | undefined }[] {
  return Object.keys(registryBlocks).map((slug) => ({
    slug,
  }));
}

export default async function ViewPage({ params }: { params: Promise<{ slug: string }> }): Promise<JSX.Element> {
  const { slug } = await params;

  const registry = getCacheRegistry(slug);

  if (!registry) {
    notFound();
  }

  const Component = registry.component;

  return <Component />;
}
