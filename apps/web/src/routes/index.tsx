import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@codefast/ui/button";
import { Badge } from "@codefast/ui/badge";

export const Route = createFileRoute("/")({ component: HomePage });

/* -------------------------------------------------------------------------- */
/* Data                                                                        */
/* -------------------------------------------------------------------------- */

const FEATURES = [
  {
    number: "01",
    title: "Radix UI primitives",
    description:
      "Every component is built on battle-tested Radix UI primitives. Keyboard navigation, ARIA attributes, and focus management are included — no configuration required.",
  },
  {
    number: "02",
    title: "Dark mode, zero config",
    description:
      "All tokens resolve automatically based on system preference or an explicit user choice. Drop in the CSS and dark mode works everywhere.",
  },
  {
    number: "03",
    title: "Tailwind CSS v4",
    description:
      "Components are unstyled HTML + Tailwind utility classes. Copy the source, customise to your brand — no wrapper components hiding your ability to adapt.",
  },
  {
    number: "04",
    title: "Strict TypeScript",
    description:
      "Full type inference on props, variants, and composition patterns. Catch mistakes at the editor, never at runtime. Every component ships with .d.ts files.",
  },
] as const;

const COMPONENT_NAMES = [
  "Accordion",
  "Alert",
  "Alert Dialog",
  "Avatar",
  "Badge",
  "Breadcrumb",
  "Button",
  "Button Group",
  "Calendar",
  "Card",
  "Carousel",
  "Checkbox",
  "Collapsible",
  "Command",
  "Context Menu",
  "Dialog",
  "Drawer",
  "Dropdown",
  "Empty",
  "Form",
  "Hover Card",
  "Input",
  "Input OTP",
  "Kbd",
  "Label",
  "Menubar",
  "Navigation Menu",
  "Pagination",
  "Popover",
  "Progress",
  "Radio Group",
  "Resizable",
  "Scroll Area",
  "Select",
  "Separator",
  "Sheet",
  "Skeleton",
  "Slider",
  "Spinner",
  "Switch",
  "Table",
  "Tabs",
  "Textarea",
  "Toast",
  "Toggle",
  "Tooltip",
] as const;

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

function HomePage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="rise-in flex min-h-[88vh] flex-col items-center justify-center px-4 py-24 text-center">
        <Badge variant="outline" className="mb-6 border-[var(--line)] text-[var(--sea-ink-soft)]">
          Open source · MIT license
        </Badge>

        <h1 className="display-title mx-auto mb-5 max-w-3xl text-[clamp(48px,6.5vw,88px)] font-bold text-[var(--sea-ink)]">
          Beautiful components{" "}
          <span className="bg-gradient-to-br from-[var(--lagoon)] to-[var(--lagoon-deep)] bg-clip-text text-transparent">
            for React 19.
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-[17px] leading-relaxed text-[var(--sea-ink-soft)]">
          Accessible, composable components built on Radix UI and styled with Tailwind CSS v4. Copy,
          customise, and ship — no black-box abstractions.
        </p>

        <div className="mb-12 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <a href="/about">Get started</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="https://github.com/codefastlabs/codefast" target="_blank" rel="noreferrer">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="size-4">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              GitHub
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {(["React 19", "TypeScript", "Tailwind CSS v4", "Radix UI"] as const).map((label) => (
            <span
              key={label}
              className="rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-3.5 py-1 text-xs font-medium text-[var(--sea-ink-soft)]"
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Dark band ────────────────────────────────────────────────── */}
      <section className="dark-band px-4 py-24 sm:py-32">
        <div className="page-wrap">
          {/* Heading */}
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold tracking-widest text-[var(--lagoon)] uppercase">
              Component library
            </p>
            <h2 className="display-title mb-4 text-[clamp(36px,4.5vw,60px)] font-bold text-white">
              Everything you need. <span className="text-[#6e6e73]">Already built.</span>
            </h2>
            <p className="text-[17px] text-[#6e6e73]">60+ components. Zero configuration.</p>
          </div>

          {/* Stats */}
          <div className="mb-16 grid grid-cols-1 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { value: "60+", label: "Components", accent: false },
              { value: "100%", label: "Accessible", accent: true },
              { value: "0", label: "Config files", accent: false },
            ].map(({ value, label, accent }) => (
              <div key={label} className="bg-white/[0.03] px-8 py-10 text-center">
                <p
                  className={`mb-1 text-5xl font-bold tabular-nums ${accent ? "text-[var(--lagoon)]" : "text-white"}`}
                >
                  {value}
                </p>
                <p className="text-sm text-[#6e6e73]">{label}</p>
              </div>
            ))}
          </div>

          {/* Component chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {COMPONENT_NAMES.map((name) => (
              <span
                key={name}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-[#a1a1a6] transition-colors hover:border-[var(--lagoon)]/40 hover:text-white"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="px-4 py-24 sm:py-32">
        <div className="page-wrap">
          <div className="mb-16 text-center">
            <p className="island-kicker mb-3">Why @codefast/ui</p>
            <h2 className="display-title text-[clamp(32px,4vw,52px)] font-bold text-[var(--sea-ink)]">
              Built for how you actually work.
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURES.map(({ number, title, description }, i) => (
              <article
                key={title}
                className="feature-card rise-in p-8"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <p className="mb-5 font-mono text-3xl font-bold text-[var(--line)]">{number}</p>
                <h3 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">{title}</h3>
                <p className="text-[15px] leading-relaxed text-[var(--sea-ink-soft)]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Install CTA ──────────────────────────────────────────────── */}
      <section className="bg-[var(--chip-bg)] px-4 py-24 sm:py-32">
        <div className="page-wrap text-center">
          <p className="island-kicker mb-4">Quick start</p>
          <h2 className="display-title mb-4 text-[clamp(32px,4vw,52px)] font-bold text-[var(--sea-ink)]">
            Start in one command.
          </h2>
          <p className="mx-auto mb-10 max-w-md text-[17px] text-[var(--sea-ink-soft)]">
            Install from npm, import a component, and ship. Tokens, dark mode, and accessibility
            come pre-configured.
          </p>
          <div className="mx-auto mb-8 w-fit rounded-xl bg-[var(--code-surface)] px-6 py-3 font-mono text-sm text-[var(--code-text)]">
            <span className="text-[var(--lagoon)] opacity-40 select-none">$ </span>
            pnpm add @codefast/ui
          </div>
          <Button size="lg" asChild>
            <a href="/about">Read the docs →</a>
          </Button>
        </div>
      </section>
    </main>
  );
}
