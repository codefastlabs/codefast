import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@codefast/ui/button";
import { Badge } from "@codefast/ui/badge";

export const Route = createFileRoute("/about")({ component: GettingStarted });

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
    code: `@import "tailwindcss";\n@import "@codefast/ui/css/neutral.css";\n@import "@codefast/ui/css/preset.css";`,
  },
  {
    step: "03",
    title: "Use a component",
    description:
      "Import any component by its named sub-path. No barrel imports, no tree-shaking surprises.",
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
    <main className="page-wrap px-4 pt-16 pb-32">
      {/* Header */}
      <section className="rise-in mb-16 max-w-2xl">
        <Badge variant="outline" className="mb-5 border-(--line) text-(--sea-ink-soft)">
          Getting Started
        </Badge>
        <h1 className="display-title mb-5 text-[clamp(40px,5vw,64px)] font-bold text-(--sea-ink)">
          Up and running{" "}
          <span className="bg-linear-to-br from-(--lagoon) to-(--lagoon-deep) bg-clip-text text-transparent">
            in minutes.
          </span>
        </h1>
        <p className="text-[17px] leading-relaxed text-(--sea-ink-soft)">
          @codefast/ui is a collection of copy-friendly React components. Install the package, wire
          up the CSS, and start building — no config files required.
        </p>
      </section>

      {/* Requirements */}
      <section className="mb-16">
        <p className="island-kicker mb-4">Requirements</p>
        <div className="inline-grid grid-cols-2 gap-x-12 gap-y-5 rounded-2xl border border-(--line) bg-(--chip-bg) p-6 sm:grid-cols-4">
          {REQUIREMENTS.map(({ label, value }) => (
            <div key={label}>
              <p className="mb-0.5 text-xs text-(--sea-ink-soft)">{label}</p>
              <p className="text-sm font-semibold text-(--sea-ink)">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mb-20">
        <p className="island-kicker mb-8">Installation</p>

        <ol className="flex flex-col gap-10">
          {STEPS.map(({ step, title, description, code }) => (
            <li key={step} className="grid gap-5 sm:grid-cols-[56px_1fr]">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-(--line) bg-(--chip-bg) font-mono text-xs font-bold text-(--sea-ink-soft)">
                {step}
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold text-(--sea-ink)">{title}</h3>
                <p className="mb-4 text-sm leading-6 text-(--sea-ink-soft)">{description}</p>
                <pre className="overflow-x-auto rounded-xl border border-(--line) bg-(--code-surface) p-5 text-sm text-(--code-text)">
                  <code>{code}</code>
                </pre>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Component list */}
      <section className="rounded-2xl border border-(--line) bg-(--chip-bg) p-8 sm:p-10">
        <p className="island-kicker mb-3">Library</p>
        <h2 className="display-title mb-3 text-3xl font-bold text-(--sea-ink)">
          60+ components available
        </h2>
        <p className="mb-8 text-(--sea-ink-soft)">
          From primitives like Button and Badge to complex patterns like Combobox, DataTable, and
          Sidebar — everything follows the same composable API.
        </p>
        <div className="mb-8 flex flex-wrap gap-2">
          {[
            "Accordion",
            "Alert",
            "Avatar",
            "Badge",
            "Button",
            "Calendar",
            "Card",
            "Carousel",
            "Checkbox",
            "Command",
            "Dialog",
            "Drawer",
            "Dropdown Menu",
            "Form",
            "Input",
            "Pagination",
            "Popover",
            "Select",
            "Separator",
            "Sheet",
            "Slider",
            "Switch",
            "Table",
            "Tabs",
            "Textarea",
            "Toast",
            "Toggle",
            "Tooltip",
          ].map((name) => (
            <Badge key={name} variant="secondary" className="font-normal">
              {name}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href="/components">Browse components →</a>
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
