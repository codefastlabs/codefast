import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type JSX, cache } from 'react';

import type { Registry } from '@/types/registry';

import { registryComponents } from '@/app/(app)/components/registry-components';
import { ComponentWrapper } from '@/components/component-wrapper';

const getCacheRegistry = cache((component: string): null | Registry => registryComponents[component]);

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
  return Object.keys(registryComponents).map((component) => ({
    slug: component,
  }));
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }): Promise<JSX.Element> {
  const { slug } = await params;

  const registry = getCacheRegistry(slug);

  if (!registry) {
    notFound();
  }

  const Component = registry.component;

  return (
    <div className="@container grid gap-6 p-6">
      <ComponentWrapper name={registry.title}>
        <Component />
      </ComponentWrapper>
    </div>
  );
}
