import { cn } from "@codefast/tailwind-variants";
import { createFileRoute } from "@tanstack/react-router";
import { ExampleForm } from "#/components/sink/react-hook-form-example";

export const Route = createFileRoute("/sink/react-hook-form/")({
  component: ReactHookFormPage,
  head: () => ({
    meta: [
      { title: "React Hook Form — Components — @codefast/ui" },
      {
        name: "description",
        content:
          "Integration example of @codefast/ui form components with React Hook Form for validation and state management.",
      },
      { property: "og:title", content: "React Hook Form — Components — @codefast/ui" },
      {
        property: "og:description",
        content:
          "Integration example of @codefast/ui form components with React Hook Form for validation and state management.",
      },
      { name: "twitter:title", content: "React Hook Form — Components — @codefast/ui" },
      {
        name: "twitter:description",
        content:
          "Integration example of @codefast/ui form components with React Hook Form for validation and state management.",
      },
    ],
  }),
});

function ReactHookFormPage() {
  return (
    <div className={cn("flex min-h-screen items-center justify-center", "p-4")}>
      <ExampleForm />
    </div>
  );
}
