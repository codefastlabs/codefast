import { createFileRoute } from "@tanstack/react-router";
import { ExampleForm } from "@/components/sink/start-form-example";

export const Route = createFileRoute("/sink/start-form/")({
  component: StartFormPage,
  head: () => ({
    meta: [
      { title: "Start Form — Components — @codefast/ui" },
      {
        name: "description",
        content:
          "Integration example of @codefast/ui form components with TanStack Start server functions.",
      },
      { property: "og:title", content: "Start Form — Components — @codefast/ui" },
      {
        property: "og:description",
        content:
          "Integration example of @codefast/ui form components with TanStack Start server functions.",
      },
      { name: "twitter:title", content: "Start Form — Components — @codefast/ui" },
      {
        name: "twitter:description",
        content:
          "Integration example of @codefast/ui form components with TanStack Start server functions.",
      },
    ],
  }),
});

function StartFormPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ExampleForm />
    </div>
  );
}
