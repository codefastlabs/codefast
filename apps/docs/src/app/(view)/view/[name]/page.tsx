import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type JSX, cache } from 'react';

import type { Registry } from '@/types/registry';

import { registryBlocks } from '@/registry/registry-blocks';

const getCacheRegistry = cache((component: string): null | Registry => registryBlocks[component]);

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const registry = getCacheRegistry(name);

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

export function generateStaticParams(): { name: string | undefined }[] {
  return Object.keys(registryBlocks).map((name) => ({
    name,
  }));
}

export default async function ViewPage({ params }: { params: Promise<{ name: string }> }): Promise<JSX.Element> {
  const { name } = await params;

  const registry = getCacheRegistry(name);

  if (!registry) {
    notFound();
  }

  const Component = registry.component;

  return <Component />;
}
