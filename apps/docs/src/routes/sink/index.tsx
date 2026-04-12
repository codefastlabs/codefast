import { cn } from "@codefast/tailwind-variants";
import { Suspense, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Skeleton } from "@codefast/ui/skeleton";
import { ComponentWrapper } from "#components/sink/app/component-wrapper";
import { componentRegistry } from "#components/sink/component-registry";

export const Route = createFileRoute("/sink/")({
  component: SinkPage,
  head: () => ({
    meta: [
      { title: "Components — @codefast/ui" },
      {
        name: "description",
        content:
          "Browse and interact with all 62 components in the @codefast/ui library. Accessible, composable, and beautifully crafted with Radix UI and Tailwind CSS.",
      },
      { property: "og:title", content: "Components — @codefast/ui" },
      {
        property: "og:description",
        content:
          "Browse and interact with all 62 components in the @codefast/ui library. Accessible, composable, and beautifully crafted with Radix UI and Tailwind CSS.",
      },
      { name: "twitter:title", content: "Components — @codefast/ui" },
      {
        name: "twitter:description",
        content:
          "Browse and interact with all 62 components in the @codefast/ui library. Accessible, composable, and beautifully crafted with Radix UI and Tailwind CSS.",
      },
    ],
  }),
});

function LazyComponentItem({
  componentKey,
  config,
}: {
  componentKey: string;
  config: (typeof componentRegistry)[string];
}) {
  const Component = config.component;

  return (
    <ComponentWrapper name={componentKey} className={config.className ?? ""}>
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <Component />
      </Suspense>
    </ComponentWrapper>
  );
}

function SinkPage() {
  const uiComponents = useMemo(
    () =>
      Object.entries(componentRegistry).filter(([, component]) => {
        return component.type === "registry:ui";
      }),
    [],
  );

  return (
    <div className={cn("grid flex-1 gap-4", "p-4", "@container")}>
      {uiComponents.map(([key, component]) => (
        <LazyComponentItem key={key} componentKey={key} config={component} />
      ))}
    </div>
  );
}
