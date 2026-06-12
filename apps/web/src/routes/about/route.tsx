import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

import { COMPONENTS } from "#/registry/components";

const COMPONENT_COUNT = COMPONENTS.length;

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Getting Started — codefast/ui" },
      {
        name: "description",
        content: "Install @codefast/ui, wire up the CSS, and start building. No config files required.",
      },
    ],
  }),
  component: GettingStarted,
});

const STEPS = [
  {
    step: "01",
    title: "Install the package",
    description: "Add @codefast/ui and its peer dependencies to your project.",
    code: "pnpm add @codefast/ui",
  },
  {
    step: "02",
    title: "Import the CSS",
    description:
      "Add the design-system stylesheet to your global CSS. It ships neutral tokens, custom Tailwind variants, and animation utilities.",
    code: `@import "tailwindcss";\n@import "@codefast/ui/css/themes/neutral.css";\n@import "@codefast/ui/css/preset.css";`,
  },
  {
    step: "03",
    title: "Use a component",
    description: "Import any component by its named sub-path. No barrel imports, no tree-shaking surprises.",
    code: `import { Button } from "@codefast/ui/button";\n\nexport function MyPage() {\n  return <Button variant="outline">Click me</Button>;\n}`,
  },
] as const;

const REQUIREMENTS = [
  { label: "React", value: "≥ 19.0.0" },
  { label: "TypeScript", value: "≥ 5.0" },
  { label: "Tailwind CSS", value: "v4" },
  { label: "Node.js", value: "≥ 20" },
] as const;

function GettingStarted() {
  return (
    <main className="container mx-auto px-4 pt-16 pb-32">
      {/* Header */}
      <section className="mb-16 max-w-2xl animate-in duration-[800ms] ease-out fill-mode-both fade-in slide-in-from-bottom-4">
        <Badge variant="outline" className="mb-5 border-ui-border text-ui-muted">
          Getting Started
        </Badge>
        <h1 className="mb-5 text-5xl leading-none font-bold tracking-tighter text-ui-fg md:text-6xl">
          Up and running <span className="text-ui-brand">in minutes.</span>
        </h1>
        <p className="text-base leading-relaxed text-ui-muted">
          @codefast/ui is a collection of copy-friendly React components. Install the package, wire up the CSS, and
          start building — no config files required.
        </p>
      </section>

      {/* Requirements */}
      <section className="mb-16">
        <p className="mb-4 text-xs font-semibold tracking-widest text-ui-brand uppercase">Requirements</p>
        <div className="inline-grid grid-cols-2 gap-x-12 gap-y-5 rounded-2xl border border-ui-border bg-ui-surface p-6 sm:grid-cols-4">
          {REQUIREMENTS.map(({ label, value }) => (
            <div key={label}>
              <p className="mb-0.5 text-xs text-ui-muted">{label}</p>
              <p className="text-sm font-semibold text-ui-fg">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mb-20">
        <p className="mb-8 text-xs font-semibold tracking-widest text-ui-brand uppercase">Installation</p>

        <ol className="flex flex-col gap-10">
          {STEPS.map(({ step, title, description, code }) => (
            <li key={step} className="grid gap-5 sm:grid-cols-[56px_1fr]">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-ui-border bg-ui-surface font-mono text-xs font-bold text-ui-muted">
                {step}
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold text-ui-fg">{title}</h3>
                <p className="mb-4 text-sm leading-6 text-ui-muted">{description}</p>
                <pre className="overflow-x-auto rounded-xl border border-ui-border bg-neutral-900 p-5 text-sm text-neutral-100">
                  <code>{code}</code>
                </pre>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Component list */}
      <section className="rounded-2xl border border-ui-border bg-ui-surface p-8 sm:p-10">
        <p className="mb-3 text-xs font-semibold tracking-widest text-ui-brand uppercase">Library</p>
        <h2 className="mb-3 text-3xl leading-none font-bold tracking-tighter text-ui-fg">
          {COMPONENT_COUNT}+ components available
        </h2>
        <p className="mb-8 text-ui-muted">
          From primitives like Button and Badge to complex patterns like Command, Calendar, and Sidebar — everything
          follows the same composable API.
        </p>
        <div className="mb-8 flex flex-wrap gap-2">
          {COMPONENTS.map(({ name }) => (
            <Badge key={name} variant="secondary" className="font-normal">
              {name}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/components">Browse components →</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://github.com/codefastlabs/codefast" target="_blank" rel="noreferrer">
              View source
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
