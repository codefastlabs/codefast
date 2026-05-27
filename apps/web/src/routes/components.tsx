import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@codefast/ui/badge";
import { PreviewCard } from "#/components/preview-card";
import { ALL_COMPONENTS } from "#/data/components";
import type { CategoryId } from "#/data/components";

// — Demo components (render as children) —
import { AlertDemo } from "#/components/examples/display/alert-demo";
import { AvatarDemo } from "#/components/examples/display/avatar-demo";
import { BadgeDemo } from "#/components/examples/display/badge-demo";
import { KbdDemo } from "#/components/examples/display/kbd-demo";
import { SpinnerDemo } from "#/components/examples/display/spinner-demo";
import { AlertDialogDemo } from "#/components/examples/feedback/alert-dialog-demo";
import { ProgressDemo } from "#/components/examples/feedback/progress-demo";
import { SkeletonDemo } from "#/components/examples/feedback/skeleton-demo";
import { CheckboxDemo } from "#/components/examples/form/checkbox-demo";
import { InputDemo } from "#/components/examples/form/input-demo";
import { RadioGroupDemo } from "#/components/examples/form/radio-group-demo";
import { SelectDemo } from "#/components/examples/form/select-demo";
import { SliderDemo } from "#/components/examples/form/slider-demo";
import { SwitchDemo } from "#/components/examples/form/switch-demo";
import { TextareaDemo } from "#/components/examples/form/textarea-demo";
import { ToggleDemo } from "#/components/examples/form/toggle-demo";
import { AccordionDemo } from "#/components/examples/layout/accordion-demo";
import { CardDemo } from "#/components/examples/layout/card-demo";
import { ScrollAreaDemo } from "#/components/examples/layout/scroll-area-demo";
import { SeparatorDemo } from "#/components/examples/layout/separator-demo";
import { BreadcrumbDemo } from "#/components/examples/navigation/breadcrumb-demo";
import { PaginationDemo } from "#/components/examples/navigation/pagination-demo";
import { TabsDemo } from "#/components/examples/navigation/tabs-demo";
import { DialogDemo } from "#/components/examples/overlay/dialog-demo";
import { DropdownMenuDemo } from "#/components/examples/overlay/dropdown-menu-demo";
import { PopoverDemo } from "#/components/examples/overlay/popover-demo";
import { TooltipDemo } from "#/components/examples/overlay/tooltip-demo";

// — Raw source strings (single barrel, ?raw resolved by Vite at build time) —
import {
  alertDemoCode,
  avatarDemoCode,
  badgeDemoCode,
  kbdDemoCode,
  spinnerDemoCode,
  alertDialogDemoCode,
  progressDemoCode,
  skeletonDemoCode,
  checkboxDemoCode,
  inputDemoCode,
  radioGroupDemoCode,
  selectDemoCode,
  sliderDemoCode,
  switchDemoCode,
  textareaDemoCode,
  toggleDemoCode,
  accordionDemoCode,
  cardDemoCode,
  scrollAreaDemoCode,
  separatorDemoCode,
  breadcrumbDemoCode,
  paginationDemoCode,
  tabsDemoCode,
  dialogDemoCode,
  dropdownMenuDemoCode,
  popoverDemoCode,
  tooltipDemoCode,
} from "#/components/examples/codes";

export const Route = createFileRoute("/components")({ component: ComponentsPage });

/* -------------------------------------------------------------------------- */
/* Shared section component                                                    */
/* -------------------------------------------------------------------------- */

type SectionProps = {
  readonly id: CategoryId;
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly count: number;
  readonly children: ReactNode;
};

function Section({ id, label, title, description, count, children }: SectionProps) {
  return (
    <section id={id} className="mb-20">
      <div className="mb-8 flex flex-col gap-3 border-b border-(--line) pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="island-kicker mb-2">{label}</p>
          <h2 className="display-title text-2xl font-bold text-(--sea-ink)">{title}</h2>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-(--sea-ink-soft)">{description}</p>
        </div>
        <span className="w-fit shrink-0 rounded-full border border-(--line) bg-(--chip-bg) px-2.5 py-1 text-xs font-semibold text-(--sea-ink-soft) tabular-nums">
          {count} components
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const CATEGORIES = [
  { id: "display", label: "Display" },
  { id: "form", label: "Form" },
  { id: "navigation", label: "Navigation" },
  { id: "overlay", label: "Overlay" },
  { id: "feedback", label: "Feedback" },
  { id: "layout", label: "Layout" },
] as const;

type FilterId = "all" | CategoryId;

const CATEGORY_COUNTS = Object.fromEntries(
  CATEGORIES.map(({ id }): [CategoryId, number] => [
    id,
    ALL_COMPONENTS.filter((c) => c.category === id).length,
  ]),
) as Record<CategoryId, number>;

type FilterOption = { readonly id: FilterId; readonly label: string };

const FILTER_OPTIONS: ReadonlyArray<FilterOption> = [{ id: "all", label: "All" }, ...CATEGORIES];

function ComponentsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  const filteredAll = useMemo(
    () =>
      activeFilter === "all"
        ? ALL_COMPONENTS
        : ALL_COMPONENTS.filter((c) => c.category === activeFilter),
    [activeFilter],
  );

  return (
    <main className="page-wrap px-4 pt-16 pb-32">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className="rise-in mb-16 max-w-2xl">
        <Badge variant="outline" className="mb-5 border-(--line) text-(--sea-ink-soft)">
          Components
        </Badge>
        <h1 className="display-title mb-5 text-[clamp(40px,5vw,64px)] font-bold text-(--sea-ink)">
          {ALL_COMPONENTS.length}+ ready-to-use{" "}
          <span className="bg-linear-to-br from-(--lagoon) to-(--lagoon-deep) bg-clip-text text-transparent">
            components.
          </span>
        </h1>
        <p className="text-[17px] leading-relaxed text-(--sea-ink-soft)">
          Built on Radix UI primitives with Tailwind CSS v4. Each component ships as a named
          sub-path import — no barrel files, no tree-shaking surprises, no config required.
        </p>
      </section>

      {/* ── Full component map ───────────────────────────────────────── */}
      <section className="mb-16 rounded-2xl border border-(--line) bg-(--chip-bg) p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-(--sea-ink)">
            All components
            <span className="ml-2 font-normal text-(--sea-ink-soft)">
              · {filteredAll.length} shown
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveFilter(id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeFilter === id
                    ? "bg-(--sea-ink) text-(--bg-base)"
                    : "border border-(--line) bg-(--surface) text-(--sea-ink-soft) hover:text-(--sea-ink)"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredAll.map(({ name, category }) => (
            <a
              key={name}
              href={`#${category}`}
              className="rounded-full border border-(--line) bg-(--surface) px-3 py-1 text-xs font-medium text-(--sea-ink-soft) no-underline transition-colors hover:border-(--lagoon) hover:text-(--sea-ink)"
            >
              {name}
            </a>
          ))}
        </div>
      </section>

      {/* ── Category quick-nav ──────────────────────────────────────── */}
      <nav className="mb-16 flex flex-wrap gap-2" aria-label="Component categories">
        {CATEGORIES.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="flex items-center gap-1.5 rounded-full border border-(--line) bg-(--chip-bg) px-4 py-1.5 text-xs font-semibold text-(--sea-ink-soft) no-underline transition-colors hover:border-(--lagoon) hover:text-(--sea-ink)"
          >
            {label}
            <span className="tabular-nums opacity-60">{CATEGORY_COUNTS[id]}</span>
          </a>
        ))}
      </nav>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* DISPLAY                                                         */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Section
        id="display"
        label="Display"
        title="Display"
        description="Presentational atoms for surfacing information, status, and identity. No interactivity required."
        count={CATEGORY_COUNTS.display}
      >
        <PreviewCard
          name="Badge"
          path="@codefast/ui/badge"
          description="Compact label for status, category, or count. Four variants cover most use cases."
          code={badgeDemoCode}
        >
          <BadgeDemo />
        </PreviewCard>

        <PreviewCard
          name="Alert"
          path="@codefast/ui/alert"
          description="Contextual banner with icon, title, and body. Supports default and destructive variants."
          wide
          code={alertDemoCode}
        >
          <AlertDemo />
        </PreviewCard>

        <PreviewCard
          name="Avatar"
          path="@codefast/ui/avatar"
          description="User icon with image support and initials fallback. Compose with AvatarGroup for stacks."
          code={avatarDemoCode}
        >
          <AvatarDemo />
        </PreviewCard>

        <PreviewCard
          name="Spinner"
          path="@codefast/ui/spinner"
          description="Indeterminate loading indicator. Wrap children — shown when loading is false."
          code={spinnerDemoCode}
        >
          <SpinnerDemo />
        </PreviewCard>

        <PreviewCard
          name="Kbd"
          path="@codefast/ui/kbd"
          description="Keyboard shortcut display. Use KbdGroup to compose multi-key combos."
          code={kbdDemoCode}
        >
          <KbdDemo />
        </PreviewCard>
      </Section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FORM                                                            */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Section
        id="form"
        label="Form"
        title="Form"
        description="Input primitives and controls for collecting user data. All keyboard-accessible and screen-reader ready."
        count={CATEGORY_COUNTS.form}
      >
        <PreviewCard
          name="Input"
          path="@codefast/ui/input"
          description="Text input with focus ring, disabled state, and file input styling."
          code={inputDemoCode}
        >
          <InputDemo />
        </PreviewCard>

        <PreviewCard
          name="Textarea"
          path="@codefast/ui/textarea"
          description="Multiline text input. Pair with Label and field utilities for accessible forms."
          code={textareaDemoCode}
        >
          <TextareaDemo />
        </PreviewCard>

        <PreviewCard
          name="Select"
          path="@codefast/ui/select"
          description="Accessible dropdown selector. Supports groups, disabled options, and custom triggers."
          code={selectDemoCode}
        >
          <SelectDemo />
        </PreviewCard>

        <PreviewCard
          name="Checkbox"
          path="@codefast/ui/checkbox"
          description="Binary control with indeterminate state. Controlled or uncontrolled via onCheckedChange."
          code={checkboxDemoCode}
        >
          <CheckboxDemo />
        </PreviewCard>

        <PreviewCard
          name="Radio Group"
          path="@codefast/ui/radio-group"
          description="Single-selection group. Use value + onValueChange for controlled behaviour."
          code={radioGroupDemoCode}
        >
          <RadioGroupDemo />
        </PreviewCard>

        <PreviewCard
          name="Switch"
          path="@codefast/ui/switch"
          description="Toggle control for boolean settings. Fires onCheckedChange with the new boolean value."
          code={switchDemoCode}
        >
          <SwitchDemo />
        </PreviewCard>

        <PreviewCard
          name="Slider"
          path="@codefast/ui/slider"
          description="Range input with keyboard support. Supports min, max, step, and multiple thumbs."
          code={sliderDemoCode}
        >
          <SliderDemo />
        </PreviewCard>

        <PreviewCard
          name="Toggle"
          path="@codefast/ui/toggle"
          description="Pressable button with active/inactive state. Use ToggleGroup for exclusive selection."
          code={toggleDemoCode}
        >
          <ToggleDemo />
        </PreviewCard>
      </Section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* NAVIGATION                                                      */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Section
        id="navigation"
        label="Navigation"
        title="Navigation"
        description="Components for moving between views, routes, and pages. Built for keyboard and screen-reader users."
        count={CATEGORY_COUNTS.navigation}
      >
        <PreviewCard
          name="Tabs"
          path="@codefast/ui/tabs"
          description="Accessible tabbed interface. Automatic or manual activation via activationMode."
          wide
          code={tabsDemoCode}
        >
          <TabsDemo />
        </PreviewCard>

        <PreviewCard
          name="Breadcrumb"
          path="@codefast/ui/breadcrumb"
          description="Hierarchical location trail. Supports custom separators, ellipsis, and asChild links."
          code={breadcrumbDemoCode}
        >
          <BreadcrumbDemo />
        </PreviewCard>

        <PreviewCard
          name="Pagination"
          path="@codefast/ui/pagination"
          description="Page navigation with prev/next, ellipsis, and active page. Compose with your router."
          code={paginationDemoCode}
        >
          <PaginationDemo />
        </PreviewCard>
      </Section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* OVERLAY                                                         */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Section
        id="overlay"
        label="Overlay"
        title="Overlay"
        description="Floating UI: modals, popovers, menus, and tooltips. All trap focus and close on Escape."
        count={CATEGORY_COUNTS.overlay}
      >
        <PreviewCard
          name="Dialog"
          path="@codefast/ui/dialog"
          description="Modal window with focus trap, backdrop blur, and accessible close. Use AlertDialog for destructive confirms."
          code={dialogDemoCode}
        >
          <DialogDemo />
        </PreviewCard>

        <PreviewCard
          name="Tooltip"
          path="@codefast/ui/tooltip"
          description="Hover label with delay and side placement control. Supports rich content including Kbd."
          code={tooltipDemoCode}
        >
          <TooltipDemo />
        </PreviewCard>

        <PreviewCard
          name="Popover"
          path="@codefast/ui/popover"
          description="Non-modal floating panel anchored to a trigger. Use for settings panels and pickers."
          code={popoverDemoCode}
        >
          <PopoverDemo />
        </PreviewCard>

        <PreviewCard
          name="Dropdown Menu"
          path="@codefast/ui/dropdown-menu"
          description="Contextual action menu with keyboard navigation, shortcuts, checkboxes, and radio groups."
          code={dropdownMenuDemoCode}
        >
          <DropdownMenuDemo />
        </PreviewCard>
      </Section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FEEDBACK                                                        */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Section
        id="feedback"
        label="Feedback"
        title="Feedback"
        description="Status indicators, confirmations, and loading states that communicate async operations to users."
        count={CATEGORY_COUNTS.feedback}
      >
        <PreviewCard
          name="Progress"
          path="@codefast/ui/progress"
          description="Determinate progress bar. Pass value 0–100. Colour via className on the indicator slot."
          code={progressDemoCode}
        >
          <ProgressDemo />
        </PreviewCard>

        <PreviewCard
          name="Alert Dialog"
          path="@codefast/ui/alert-dialog"
          description="Blocking confirmation modal requiring an explicit decision. Backs the browser back button."
          code={alertDialogDemoCode}
        >
          <AlertDialogDemo />
        </PreviewCard>

        <PreviewCard
          name="Skeleton"
          path="@codefast/ui/skeleton"
          description="Shimmer placeholder for any shape of content — cards, text lines, avatars."
          wide
          code={skeletonDemoCode}
        >
          <SkeletonDemo />
        </PreviewCard>
      </Section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* LAYOUT                                                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Section
        id="layout"
        label="Layout"
        title="Layout"
        description="Structural components for organising and containing content. Compose freely with any child."
        count={CATEGORY_COUNTS.layout}
      >
        <PreviewCard
          name="Card"
          path="@codefast/ui/card"
          description="Elevated surface for grouping related content. Compose Header, Content, and Footer slots freely."
          code={cardDemoCode}
        >
          <CardDemo />
        </PreviewCard>

        <PreviewCard
          name="Accordion"
          path="@codefast/ui/accordion"
          description="Expandable sections with smooth animation. Supports single or multiple open items."
          wide
          code={accordionDemoCode}
        >
          <AccordionDemo />
        </PreviewCard>

        <PreviewCard
          name="Separator"
          path="@codefast/ui/separator"
          description="Semantic horizontal or vertical divider. Renders as hr with role=separator."
          code={separatorDemoCode}
        >
          <SeparatorDemo />
        </PreviewCard>

        <PreviewCard
          name="Scroll Area"
          path="@codefast/ui/scroll-area"
          description="Custom-styled scrollbar that matches your design system. Hides native OS scrollbars."
          code={scrollAreaDemoCode}
        >
          <ScrollAreaDemo />
        </PreviewCard>
      </Section>
    </main>
  );
}
