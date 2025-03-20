import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type JSX, cache } from 'react';

import type { Registry } from '@/app/(app)/components/[component]/registries';

import { registries } from '@/app/(app)/components/[component]/registries';
import { ComponentWrapper } from '@/components/component-wrapper';

const getCacheRegistry = cache((component: string): null | Registry => registries[component]);

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ component: string }> }): Promise<Metadata> {
  const { component } = await params;
  const registry = getCacheRegistry(component);

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

export function generateStaticParams(): { component: string }[] {
  return Object.keys(registries).map((component) => ({
    component,
  }));
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ component: string }>;
}): Promise<JSX.Element> {
  const { component } = await params;

  const registry = getCacheRegistry(component);

  if (!registry) {
    notFound();
  }

  const Component = registry.component;

  return (
    <div className="@container grid gap-4 p-4 2xl:container 2xl:mx-auto">
      <ComponentWrapper name={registry.title}>
        <Component />
      </ComponentWrapper>
    </div>
  );
}
