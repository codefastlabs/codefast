import type { Metadata } from 'next';
import type { JSX } from 'react';

import { notFound } from 'next/navigation';
import { cache } from 'react';

import type { RegistryItem } from '@/types/registry';

import { BlockDisplay } from '@/components/block-display';
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

export function generateStaticParams(): { slug: string }[] {
  return Object.keys(registryBlocks).map((component) => ({
    slug: component,
  }));
}

export default async function BlockPage({ params }: { params: Promise<{ slug: string }> }): Promise<JSX.Element> {
  const { slug } = await params;

  const registry = getCacheRegistry(slug);

  if (!registry) {
    notFound();
  }

  return (
    <div className="flex grow flex-col p-6">
      <BlockDisplay name={registry.slug} />
    </div>
  );
}
