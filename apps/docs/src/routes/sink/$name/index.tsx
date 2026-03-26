import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Skeleton } from "@codefast/ui/skeleton";
import { componentRegistry } from "@/components/sink/component-registry";

export const Route = createFileRoute("/sink/$name/")({
  component: ComponentPage,
  head: ({ params }) => {
    const component = componentRegistry[params.name];

    if (!component || component.type !== "registry:ui") {
      return {
        meta: [{ title: "Component Not Found — @codefast/ui" }],
      };
    }

    return {
      meta: [
        { title: `${component.name} — Components — @codefast/ui` },
        {
          name: "description",
          content: `Interactive demo of the ${component.name} component from @codefast/ui. Built with Radix UI and Tailwind CSS.`,
        },
        { property: "og:title", content: `${component.name} — Components — @codefast/ui` },
        {
          property: "og:description",
          content: `Interactive demo of the ${component.name} component from @codefast/ui. Built with Radix UI and Tailwind CSS.`,
        },
        { name: "twitter:title", content: `${component.name} — Components — @codefast/ui` },
        {
          name: "twitter:description",
          content: `Interactive demo of the ${component.name} component from @codefast/ui. Built with Radix UI and Tailwind CSS.`,
        },
      ],
    };
  },
});

function ComponentPage() {
  const { name } = Route.useParams();
  const config = componentRegistry[name];

  if (!config || config.type !== "registry:ui") {
    return <div className="p-6 text-center">Component not found</div>;
  }

  const Component = config.component;

  return (
    <div className="p-6">
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Component />
      </Suspense>
    </div>
  );
}
