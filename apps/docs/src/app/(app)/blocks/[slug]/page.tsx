import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type JSX, cache } from 'react';

import type { Registry } from '@/types/registry';

import { BlockPreview } from '@/app/(app)/blocks/[slug]/_components/block-preview';
import { registryBlocks } from '@/registry/registry-blocks';

const getCacheRegistry = cache((component: string): null | Registry => registryBlocks[component]);

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
      <BlockPreview slug={slug} title={registry.title} />
    </div>
  );
}
