import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { JSX } from "react";

import { registryComponents } from "@/app/(app)/components/registry-components";
import { ComponentWrapper } from "@/components/component-wrapper";
import { getCachedComponentsRegistry } from "@/lib/registry-cache";

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const registry = getCachedComponentsRegistry(slug);

  if (!registry) {
    return {};
  }

  const title = registry.title;
  const description = registry.description;

  return {
    description,
    title,
  };
}

export function generateStaticParams(): { slug: string }[] {
  return Object.keys(registryComponents).map((component) => ({
    slug: component,
  }));
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<JSX.Element> {
  const { slug } = await params;

  const registry = getCachedComponentsRegistry(slug);

  if (!registry) {
    notFound();
  }

  return (
    <div className="@container grid gap-6 p-6">
      <ComponentWrapper name={registry.slug}>
        <registry.component />
      </ComponentWrapper>
    </div>
  );
}
