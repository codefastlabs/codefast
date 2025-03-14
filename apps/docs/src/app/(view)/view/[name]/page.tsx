import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type JSX, cache, Suspense } from 'react';

import { getRegistryComponent, getRegistryItem } from '@/lib/registry';

const getCachedRegistryItem = cache((name: string) => getRegistryItem(name));

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const item = getCachedRegistryItem(name);

  if (!item) {
    return {};
  }

  const title = item.name;
  const description = item.description;

  return {
    title,
    description,
  };
}

export default async function ViewPage({ params }: { params: Promise<{ name: string }> }): Promise<JSX.Element> {
  const { name } = await params;
  const item = getCachedRegistryItem(name);
  const Component = getRegistryComponent(name);

  if (!item || !Component) {
    notFound();
  }

  return (
    <div className="@container">
      <Suspense>
        <Component />
      </Suspense>
    </div>
  );
}
