import { notFound } from "next/navigation";

import type { Metadata } from "next";
import type { JSX } from "react";

import { getCachedBlockRegistry } from "@/lib/registry-cache";
import { registryBlocks } from "@/registry/registry-blocks";


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

export function generateStaticParams(): { slug: string | undefined }[] {
  return Object.keys(registryBlocks).map((slug) => ({
    slug,
  }));
}

export default async function ViewPage({ params }: { params: Promise<{ slug: string }> }): Promise<JSX.Element> {
  const { slug } = await params;

  const registry = getCachedBlockRegistry(slug);

  if (!registry) {
    notFound();
  }

  return <registry.component />;
}
