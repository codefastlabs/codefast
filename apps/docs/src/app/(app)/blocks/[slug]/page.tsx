import { notFound } from "next/navigation";

import { BlockDisplay } from "@/components/block-display";
import { getCachedBlockRegistry } from "@/lib/registry-cache";
import { registryBlocks } from "@/registry/registry-blocks";

import type { Metadata } from "next";
import type { JSX } from "react";

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const registry = getCachedBlockRegistry(slug);

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

  const registry = getCachedBlockRegistry(slug);

  if (!registry) {
    notFound();
  }

  return (
    <div className="flex grow flex-col p-6">
      <BlockDisplay name={registry.slug} />
    </div>
  );
}
