import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@codefast/ui/badge";
import { highlightMany } from "#/lib/highlighter.ts";
import { PreviewCard } from "#/components/preview-card";
import { ALL_COMPONENTS } from "#/data/components";
import type { CategoryId } from "#/data/components";

// — Demo components (render as children) —
import { AlertDemo } from "#/components/examples/display/alert-demo";
import { AspectRatioDemo } from "#/components/examples/display/aspect-ratio-demo";
import { AvatarDemo } from "#/components/examples/display/avatar-demo";
import { BadgeDemo } from "#/components/examples/display/badge-demo";
import { CarouselDemo } from "#/components/examples/display/carousel-demo";
import { ChartDemo } from "#/components/examples/display/chart-demo";
import { EmptyDemo } from "#/components/examples/display/empty-demo";
import { ItemDemo } from "#/components/examples/display/item-demo";
import { KbdDemo } from "#/components/examples/display/kbd-demo";
import { SpinnerDemo } from "#/components/examples/display/spinner-demo";
import { TableDemo } from "#/components/examples/display/table-demo";
import { AlertDialogDemo } from "#/components/examples/feedback/alert-dialog-demo";
import { ProgressDemo } from "#/components/examples/feedback/progress-demo";
import { ProgressCircleDemo } from "#/components/examples/feedback/progress-circle-demo";
import { SkeletonDemo } from "#/components/examples/feedback/skeleton-demo";
import { SonnerDemo } from "#/components/examples/feedback/sonner-demo";
import { ButtonDemo } from "#/components/examples/form/button-demo";
import { ButtonGroupDemo } from "#/components/examples/form/button-group-demo";
import { CalendarDemo } from "#/components/examples/form/calendar-demo";
import { CheckboxDemo } from "#/components/examples/form/checkbox-demo";
import { CheckboxCardsDemo } from "#/components/examples/form/checkbox-cards-demo";
import { CheckboxGroupDemo } from "#/components/examples/form/checkbox-group-demo";
import { FieldDemo } from "#/components/examples/form/field-demo";
import { FormDemo } from "#/components/examples/form/form-demo";
import { InputDemo } from "#/components/examples/form/input-demo";
import { InputGroupDemo } from "#/components/examples/form/input-group-demo";
import { InputNumberDemo } from "#/components/examples/form/input-number-demo";
import { InputOTPDemo } from "#/components/examples/form/input-otp-demo";
import { InputPasswordDemo } from "#/components/examples/form/input-password-demo";
import { InputSearchDemo } from "#/components/examples/form/input-search-demo";
import { LabelDemo } from "#/components/examples/form/label-demo";
import { NativeSelectDemo } from "#/components/examples/form/native-select-demo";
import { RadioDemo } from "#/components/examples/form/radio-demo";
import { RadioCardsDemo } from "#/components/examples/form/radio-cards-demo";
import { RadioGroupDemo } from "#/components/examples/form/radio-group-demo";
import { SelectDemo } from "#/components/examples/form/select-demo";
import { SliderDemo } from "#/components/examples/form/slider-demo";
import { SwitchDemo } from "#/components/examples/form/switch-demo";
import { TextareaDemo } from "#/components/examples/form/textarea-demo";
import { ToggleDemo } from "#/components/examples/form/toggle-demo";
import { ToggleGroupDemo } from "#/components/examples/form/toggle-group-demo";
import { AccordionDemo } from "#/components/examples/layout/accordion-demo";
import { CardDemo } from "#/components/examples/layout/card-demo";
import { CollapsibleDemo } from "#/components/examples/layout/collapsible-demo";
import { ResizableDemo } from "#/components/examples/layout/resizable-demo";
import { ScrollAreaDemo } from "#/components/examples/layout/scroll-area-demo";
import { SeparatorDemo } from "#/components/examples/layout/separator-demo";
import { BreadcrumbDemo } from "#/components/examples/navigation/breadcrumb-demo";
import { MenubarDemo } from "#/components/examples/navigation/menubar-demo";
import { NavigationMenuDemo } from "#/components/examples/navigation/navigation-menu-demo";
import { PaginationDemo } from "#/components/examples/navigation/pagination-demo";
import { TabsDemo } from "#/components/examples/navigation/tabs-demo";
import { CommandDemo } from "#/components/examples/overlay/command-demo";
import { ContextMenuDemo } from "#/components/examples/overlay/context-menu-demo";
import { DialogDemo } from "#/components/examples/overlay/dialog-demo";
import { DrawerDemo } from "#/components/examples/overlay/drawer-demo";
import { DropdownMenuDemo } from "#/components/examples/overlay/dropdown-menu-demo";
import { HoverCardDemo } from "#/components/examples/overlay/hover-card-demo";
import { PopoverDemo } from "#/components/examples/overlay/popover-demo";
import { SheetDemo } from "#/components/examples/overlay/sheet-demo";
import { TooltipDemo } from "#/components/examples/overlay/tooltip-demo";

// — Raw source strings (single barrel, ?raw resolved by Vite at build time) —
import {
  alertDemoCode,
  aspectRatioDemoCode,
  avatarDemoCode,
  badgeDemoCode,
  carouselDemoCode,
  chartDemoCode,
  emptyDemoCode,
  itemDemoCode,
  kbdDemoCode,
  spinnerDemoCode,
  tableDemoCode,
  alertDialogDemoCode,
  progressDemoCode,
  progressCircleDemoCode,
  skeletonDemoCode,
  sonnerDemoCode,
  buttonDemoCode,
  buttonGroupDemoCode,
  calendarDemoCode,
  checkboxDemoCode,
  checkboxCardsDemoCode,
  checkboxGroupDemoCode,
  fieldDemoCode,
  formDemoCode,
  inputDemoCode,
  inputGroupDemoCode,
  inputNumberDemoCode,
  inputOtpDemoCode,
  inputPasswordDemoCode,
  inputSearchDemoCode,
  labelDemoCode,
  nativeSelectDemoCode,
  radioDemoCode,
  radioCardsDemoCode,
  radioGroupDemoCode,
  selectDemoCode,
  sliderDemoCode,
  switchDemoCode,
  textareaDemoCode,
  toggleDemoCode,
  toggleGroupDemoCode,
  accordionDemoCode,
  cardDemoCode,
  collapsibleDemoCode,
  resizableDemoCode,
  scrollAreaDemoCode,
  separatorDemoCode,
  breadcrumbDemoCode,
  menubarDemoCode,
  navigationMenuDemoCode,
  paginationDemoCode,
  tabsDemoCode,
  commandDemoCode,
  contextMenuDemoCode,
  dialogDemoCode,
  drawerDemoCode,
  dropdownMenuDemoCode,
  hoverCardDemoCode,
  popoverDemoCode,
  sheetDemoCode,
  tooltipDemoCode,
} from "#/components/examples/codes";

/* -------------------------------------------------------------------------- */
/* Code map — keys used to look up pre-highlighted HTML from loader data      */
/* -------------------------------------------------------------------------- */

const CODE_MAP = {
  badge: badgeDemoCode,
  alert: alertDemoCode,
  avatar: avatarDemoCode,
  spinner: spinnerDemoCode,
  kbd: kbdDemoCode,
  aspectRatio: aspectRatioDemoCode,
  carousel: carouselDemoCode,
  chart: chartDemoCode,
  empty: emptyDemoCode,
  item: itemDemoCode,
  table: tableDemoCode,
  button: buttonDemoCode,
  buttonGroup: buttonGroupDemoCode,
  input: inputDemoCode,
  inputGroup: inputGroupDemoCode,
  inputNumber: inputNumberDemoCode,
  inputOtp: inputOtpDemoCode,
  inputPassword: inputPasswordDemoCode,
  inputSearch: inputSearchDemoCode,
  textarea: textareaDemoCode,
  select: selectDemoCode,
  nativeSelect: nativeSelectDemoCode,
  checkbox: checkboxDemoCode,
  checkboxGroup: checkboxGroupDemoCode,
  checkboxCards: checkboxCardsDemoCode,
  radio: radioDemoCode,
  radioGroup: radioGroupDemoCode,
  radioCards: radioCardsDemoCode,
  switch: switchDemoCode,
  slider: sliderDemoCode,
  toggle: toggleDemoCode,
  toggleGroup: toggleGroupDemoCode,
  calendar: calendarDemoCode,
  label: labelDemoCode,
  field: fieldDemoCode,
  form: formDemoCode,
  tabs: tabsDemoCode,
  breadcrumb: breadcrumbDemoCode,
  pagination: paginationDemoCode,
  menubar: menubarDemoCode,
  navigationMenu: navigationMenuDemoCode,
  dialog: dialogDemoCode,
  tooltip: tooltipDemoCode,
  popover: popoverDemoCode,
  dropdownMenu: dropdownMenuDemoCode,
  alertDialog: alertDialogDemoCode,
  command: commandDemoCode,
  contextMenu: contextMenuDemoCode,
  drawer: drawerDemoCode,
  hoverCard: hoverCardDemoCode,
  sheet: sheetDemoCode,
  progress: progressDemoCode,
  progressCircle: progressCircleDemoCode,
  skeleton: skeletonDemoCode,
  sonner: sonnerDemoCode,
  card: cardDemoCode,
  accordion: accordionDemoCode,
  separator: separatorDemoCode,
  scrollArea: scrollAreaDemoCode,
  collapsible: collapsibleDemoCode,
  resizable: resizableDemoCode,
} as const;

type HighlightedCodes = Record<keyof typeof CODE_MAP, string>;

export const Route = createFileRoute("/components")({
  loader: async (): Promise<HighlightedCodes> => {
    const keys = Object.keys(CODE_MAP) as Array<keyof typeof CODE_MAP>;
    const highlighted = await highlightMany(Object.values(CODE_MAP));
    return Object.fromEntries(keys.map((key, i) => [key, highlighted[i]])) as HighlightedCodes;
  },
  staleTime: Infinity,
  component: ComponentsPage,
});

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

const DEMO_COMPONENTS = ALL_COMPONENTS.filter((component) => component.name !== "Sidebar");

const CATEGORY_COUNTS = Object.fromEntries(
  CATEGORIES.map(({ id }): [CategoryId, number] => [
    id,
    DEMO_COMPONENTS.filter((c) => c.category === id).length,
  ]),
) as Record<CategoryId, number>;

type FilterOption = { readonly id: FilterId; readonly label: string };

const FILTER_OPTIONS: ReadonlyArray<FilterOption> = [{ id: "all", label: "All" }, ...CATEGORIES];

function ComponentsPage() {
  const hl = Route.useLoaderData();
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  const filteredAll = useMemo(
    () =>
      activeFilter === "all"
        ? DEMO_COMPONENTS
        : DEMO_COMPONENTS.filter((c) => c.category === activeFilter),
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
          {DEMO_COMPONENTS.length}+ ready-to-use{" "}
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
          highlightedCode={hl.badge}
        >
          <BadgeDemo />
        </PreviewCard>

        <PreviewCard
          name="Alert"
          path="@codefast/ui/alert"
          description="Contextual banner with icon, title, and body. Supports default and destructive variants."
          wide
          code={alertDemoCode}
          highlightedCode={hl.alert}
        >
          <AlertDemo />
        </PreviewCard>

        <PreviewCard
          name="Avatar"
          path="@codefast/ui/avatar"
          description="User icon with image support and initials fallback. Compose with AvatarGroup for stacks."
          code={avatarDemoCode}
          highlightedCode={hl.avatar}
        >
          <AvatarDemo />
        </PreviewCard>

        <PreviewCard
          name="Spinner"
          path="@codefast/ui/spinner"
          description="Indeterminate loading indicator. Wrap children — shown when loading is false."
          code={spinnerDemoCode}
          highlightedCode={hl.spinner}
        >
          <SpinnerDemo />
        </PreviewCard>

        <PreviewCard
          name="Kbd"
          path="@codefast/ui/kbd"
          description="Keyboard shortcut display. Use KbdGroup to compose multi-key combos."
          code={kbdDemoCode}
          highlightedCode={hl.kbd}
        >
          <KbdDemo />
        </PreviewCard>

        <PreviewCard
          name="Aspect Ratio"
          path="@codefast/ui/aspect-ratio"
          description="Locks content to a specific width-to-height ratio. Useful for images, videos, and embeds."
          code={aspectRatioDemoCode}
          highlightedCode={hl.aspectRatio}
        >
          <AspectRatioDemo />
        </PreviewCard>

        <PreviewCard
          name="Carousel"
          path="@codefast/ui/carousel"
          description="Embla-powered slide carousel with prev/next controls. Supports horizontal and vertical axes."
          code={carouselDemoCode}
          highlightedCode={hl.carousel}
        >
          <CarouselDemo />
        </PreviewCard>

        <PreviewCard
          name="Chart"
          path="@codefast/ui/chart"
          description="Recharts wrapper with consistent theming, tooltip, and legend. Supports all chart types."
          wide
          code={chartDemoCode}
          highlightedCode={hl.chart}
        >
          <ChartDemo />
        </PreviewCard>

        <PreviewCard
          name="Empty"
          path="@codefast/ui/empty"
          description="Empty-state layout with media, title, description, and action slots."
          code={emptyDemoCode}
          highlightedCode={hl.empty}
        >
          <EmptyDemo />
        </PreviewCard>

        <PreviewCard
          name="Item"
          path="@codefast/ui/item"
          description="Row layout for lists. Composes media, content, title, description, and action slots."
          wide
          code={itemDemoCode}
          highlightedCode={hl.item}
        >
          <ItemDemo />
        </PreviewCard>

        <PreviewCard
          name="Table"
          path="@codefast/ui/table"
          description="Semantic HTML table with styled header, body, footer, and caption slots."
          wide
          code={tableDemoCode}
          highlightedCode={hl.table}
        >
          <TableDemo />
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
          name="Button"
          path="@codefast/ui/button"
          description="Six variants and four sizes. Supports icons, loading state, and asChild composition."
          wide
          code={buttonDemoCode}
          highlightedCode={hl.button}
        >
          <ButtonDemo />
        </PreviewCard>

        <PreviewCard
          name="Button Group"
          path="@codefast/ui/button-group"
          description="Horizontal or vertical group that visually joins adjacent buttons into a single control."
          code={buttonGroupDemoCode}
          highlightedCode={hl.buttonGroup}
        >
          <ButtonGroupDemo />
        </PreviewCard>

        <PreviewCard
          name="Input"
          path="@codefast/ui/input"
          description="Text input with focus ring, disabled state, and file input styling."
          code={inputDemoCode}
          highlightedCode={hl.input}
        >
          <InputDemo />
        </PreviewCard>

        <PreviewCard
          name="Input Group"
          path="@codefast/ui/input-group"
          description="Composes an input with leading/trailing addons, text labels, and icon buttons."
          wide
          code={inputGroupDemoCode}
          highlightedCode={hl.inputGroup}
        >
          <InputGroupDemo />
        </PreviewCard>

        <PreviewCard
          name="Input Number"
          path="@codefast/ui/input-number"
          description="Numeric input with increment/decrement controls, min/max/step, and format options."
          code={inputNumberDemoCode}
          highlightedCode={hl.inputNumber}
        >
          <InputNumberDemo />
        </PreviewCard>

        <PreviewCard
          name="Input OTP"
          path="@codefast/ui/input-otp"
          description="One-time password input with slot groups and separator. Built on input-otp."
          code={inputOtpDemoCode}
          highlightedCode={hl.inputOtp}
        >
          <InputOTPDemo />
        </PreviewCard>

        <PreviewCard
          name="Input Password"
          path="@codefast/ui/input-password"
          description="Password field with a show/hide toggle. Extends Input Group with no extra markup."
          code={inputPasswordDemoCode}
          highlightedCode={hl.inputPassword}
        >
          <InputPasswordDemo />
        </PreviewCard>

        <PreviewCard
          name="Input Search"
          path="@codefast/ui/input-search"
          description="Search field with a leading icon and a one-click clear button. Controlled or uncontrolled."
          code={inputSearchDemoCode}
          highlightedCode={hl.inputSearch}
        >
          <InputSearchDemo />
        </PreviewCard>

        <PreviewCard
          name="Textarea"
          path="@codefast/ui/textarea"
          description="Multiline text input. Pair with Label and field utilities for accessible forms."
          code={textareaDemoCode}
          highlightedCode={hl.textarea}
        >
          <TextareaDemo />
        </PreviewCard>

        <PreviewCard
          name="Select"
          path="@codefast/ui/select"
          description="Accessible dropdown selector. Supports groups, disabled options, and custom triggers."
          code={selectDemoCode}
          highlightedCode={hl.select}
        >
          <SelectDemo />
        </PreviewCard>

        <PreviewCard
          name="Native Select"
          path="@codefast/ui/native-select"
          description="Styled HTML select element with option groups. Zero JS — best for mobile forms."
          code={nativeSelectDemoCode}
          highlightedCode={hl.nativeSelect}
        >
          <NativeSelectDemo />
        </PreviewCard>

        <PreviewCard
          name="Checkbox"
          path="@codefast/ui/checkbox"
          description="Binary control with indeterminate state. Controlled or uncontrolled via onCheckedChange."
          code={checkboxDemoCode}
          highlightedCode={hl.checkbox}
        >
          <CheckboxDemo />
        </PreviewCard>

        <PreviewCard
          name="Checkbox Group"
          path="@codefast/ui/checkbox-group"
          description="Multi-select group of checkboxes sharing a value array. Supports disabled items."
          code={checkboxGroupDemoCode}
          highlightedCode={hl.checkboxGroup}
        >
          <CheckboxGroupDemo />
        </PreviewCard>

        <PreviewCard
          name="Checkbox Cards"
          path="@codefast/ui/checkbox-cards"
          description="Card-style multi-select. Each card has a built-in checkbox with highlighted selected state."
          code={checkboxCardsDemoCode}
          highlightedCode={hl.checkboxCards}
        >
          <CheckboxCardsDemo />
        </PreviewCard>

        <PreviewCard
          name="Radio"
          path="@codefast/ui/radio"
          description="Single native radio input. Use Radio Group for accessible keyboard-navigable groups."
          code={radioDemoCode}
          highlightedCode={hl.radio}
        >
          <RadioDemo />
        </PreviewCard>

        <PreviewCard
          name="Radio Group"
          path="@codefast/ui/radio-group"
          description="Single-selection group. Use value + onValueChange for controlled behaviour."
          code={radioGroupDemoCode}
          highlightedCode={hl.radioGroup}
        >
          <RadioGroupDemo />
        </PreviewCard>

        <PreviewCard
          name="Radio Cards"
          path="@codefast/ui/radio-cards"
          description="Card-style single-select. Each card highlights when selected, ideal for plan pickers."
          code={radioCardsDemoCode}
          highlightedCode={hl.radioCards}
        >
          <RadioCardsDemo />
        </PreviewCard>

        <PreviewCard
          name="Switch"
          path="@codefast/ui/switch"
          description="Toggle control for boolean settings. Fires onCheckedChange with the new boolean value."
          code={switchDemoCode}
          highlightedCode={hl.switch}
        >
          <SwitchDemo />
        </PreviewCard>

        <PreviewCard
          name="Slider"
          path="@codefast/ui/slider"
          description="Range input with keyboard support. Supports min, max, step, and multiple thumbs."
          code={sliderDemoCode}
          highlightedCode={hl.slider}
        >
          <SliderDemo />
        </PreviewCard>

        <PreviewCard
          name="Toggle"
          path="@codefast/ui/toggle"
          description="Pressable button with active/inactive state. Use ToggleGroup for exclusive selection."
          code={toggleDemoCode}
          highlightedCode={hl.toggle}
        >
          <ToggleDemo />
        </PreviewCard>

        <PreviewCard
          name="Toggle Group"
          path="@codefast/ui/toggle-group"
          description="Single or multiple selection group of toggle buttons. Ideal for toolbars and alignment pickers."
          code={toggleGroupDemoCode}
          highlightedCode={hl.toggleGroup}
        >
          <ToggleGroupDemo />
        </PreviewCard>

        <PreviewCard
          name="Calendar"
          path="@codefast/ui/calendar"
          description="Full calendar built on react-day-picker. Supports single, multiple, and range selection."
          code={calendarDemoCode}
          highlightedCode={hl.calendar}
        >
          <CalendarDemo />
        </PreviewCard>

        <PreviewCard
          name="Label"
          path="@codefast/ui/label"
          description="Accessible form label that forwards htmlFor. Pairs with any form control."
          code={labelDemoCode}
          highlightedCode={hl.label}
        >
          <LabelDemo />
        </PreviewCard>

        <PreviewCard
          name="Field"
          path="@codefast/ui/field"
          description="Layout wrapper that composes label, description, error, and control in vertical or horizontal orientation."
          wide
          code={fieldDemoCode}
          highlightedCode={hl.field}
        >
          <FieldDemo />
        </PreviewCard>

        <PreviewCard
          name="Form"
          path="@codefast/ui/form"
          description="React Hook Form integration with accessible label, description, and error message binding."
          code={formDemoCode}
          highlightedCode={hl.form}
        >
          <FormDemo />
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
          highlightedCode={hl.tabs}
        >
          <TabsDemo />
        </PreviewCard>

        <PreviewCard
          name="Breadcrumb"
          path="@codefast/ui/breadcrumb"
          description="Hierarchical location trail. Supports custom separators, ellipsis, and asChild links."
          code={breadcrumbDemoCode}
          highlightedCode={hl.breadcrumb}
        >
          <BreadcrumbDemo />
        </PreviewCard>

        <PreviewCard
          name="Pagination"
          path="@codefast/ui/pagination"
          description="Page navigation with prev/next, ellipsis, and active page. Compose with your router."
          code={paginationDemoCode}
          highlightedCode={hl.pagination}
        >
          <PaginationDemo />
        </PreviewCard>

        <PreviewCard
          name="Menubar"
          path="@codefast/ui/menubar"
          description="Horizontal menu bar with dropdowns, checkboxes, radio items, and keyboard navigation."
          wide
          code={menubarDemoCode}
          highlightedCode={hl.menubar}
        >
          <MenubarDemo />
        </PreviewCard>

        <PreviewCard
          name="Navigation Menu"
          path="@codefast/ui/navigation-menu"
          description="Animated mega-menu with animated content panels. Built on Radix NavigationMenu."
          wide
          code={navigationMenuDemoCode}
          highlightedCode={hl.navigationMenu}
        >
          <NavigationMenuDemo />
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
          highlightedCode={hl.dialog}
        >
          <DialogDemo />
        </PreviewCard>

        <PreviewCard
          name="Tooltip"
          path="@codefast/ui/tooltip"
          description="Hover label with delay and side placement control. Supports rich content including Kbd."
          code={tooltipDemoCode}
          highlightedCode={hl.tooltip}
        >
          <TooltipDemo />
        </PreviewCard>

        <PreviewCard
          name="Popover"
          path="@codefast/ui/popover"
          description="Non-modal floating panel anchored to a trigger. Use for settings panels and pickers."
          code={popoverDemoCode}
          highlightedCode={hl.popover}
        >
          <PopoverDemo />
        </PreviewCard>

        <PreviewCard
          name="Dropdown Menu"
          path="@codefast/ui/dropdown-menu"
          description="Contextual action menu with keyboard navigation, shortcuts, checkboxes, and radio groups."
          code={dropdownMenuDemoCode}
          highlightedCode={hl.dropdownMenu}
        >
          <DropdownMenuDemo />
        </PreviewCard>

        <PreviewCard
          name="Alert Dialog"
          path="@codefast/ui/alert-dialog"
          description="Blocking confirmation modal requiring an explicit decision. Backs the browser back button."
          code={alertDialogDemoCode}
          highlightedCode={hl.alertDialog}
        >
          <AlertDialogDemo />
        </PreviewCard>

        <PreviewCard
          name="Command"
          path="@codefast/ui/command"
          description="Command palette with fuzzy search, groups, keyboard shortcuts, and empty state."
          code={commandDemoCode}
          highlightedCode={hl.command}
        >
          <CommandDemo />
        </PreviewCard>

        <PreviewCard
          name="Context Menu"
          path="@codefast/ui/context-menu"
          description="Right-click menu with items, checkboxes, radio groups, submenus, and shortcuts."
          code={contextMenuDemoCode}
          highlightedCode={hl.contextMenu}
        >
          <ContextMenuDemo />
        </PreviewCard>

        <PreviewCard
          name="Drawer"
          path="@codefast/ui/drawer"
          description="Bottom sheet drawer built on Vaul. Supports drag-to-dismiss and scale background."
          code={drawerDemoCode}
          highlightedCode={hl.drawer}
        >
          <DrawerDemo />
        </PreviewCard>

        <PreviewCard
          name="Hover Card"
          path="@codefast/ui/hover-card"
          description="Rich preview card that appears on hover. Ideal for user profiles and link previews."
          code={hoverCardDemoCode}
          highlightedCode={hl.hoverCard}
        >
          <HoverCardDemo />
        </PreviewCard>

        <PreviewCard
          name="Sheet"
          path="@codefast/ui/sheet"
          description="Side-anchored panel (left, right, top, or bottom). Useful for settings and detail drawers."
          code={sheetDemoCode}
          highlightedCode={hl.sheet}
        >
          <SheetDemo />
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
          highlightedCode={hl.progress}
        >
          <ProgressDemo />
        </PreviewCard>

        <PreviewCard
          name="Progress Circle"
          path="@codefast/ui/progress-circle"
          description="Circular progress indicator with optional value label and animation. Multiple sizes."
          code={progressCircleDemoCode}
          highlightedCode={hl.progressCircle}
        >
          <ProgressCircleDemo />
        </PreviewCard>

        <PreviewCard
          name="Skeleton"
          path="@codefast/ui/skeleton"
          description="Shimmer placeholder for any shape of content — cards, text lines, avatars."
          wide
          code={skeletonDemoCode}
          highlightedCode={hl.skeleton}
        >
          <SkeletonDemo />
        </PreviewCard>

        <PreviewCard
          name="Sonner"
          path="@codefast/ui/sonner"
          description="Toast notifications via Sonner. Supports success, error, warning, and custom durations."
          wide
          code={sonnerDemoCode}
          highlightedCode={hl.sonner}
        >
          <SonnerDemo />
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
          highlightedCode={hl.card}
        >
          <CardDemo />
        </PreviewCard>

        <PreviewCard
          name="Accordion"
          path="@codefast/ui/accordion"
          description="Expandable sections with smooth animation. Supports single or multiple open items."
          wide
          code={accordionDemoCode}
          highlightedCode={hl.accordion}
        >
          <AccordionDemo />
        </PreviewCard>

        <PreviewCard
          name="Separator"
          path="@codefast/ui/separator"
          description="Semantic horizontal or vertical divider. Renders as hr with role=separator."
          code={separatorDemoCode}
          highlightedCode={hl.separator}
        >
          <SeparatorDemo />
        </PreviewCard>

        <PreviewCard
          name="Scroll Area"
          path="@codefast/ui/scroll-area"
          description="Custom-styled scrollbar that matches your design system. Hides native OS scrollbars."
          code={scrollAreaDemoCode}
          highlightedCode={hl.scrollArea}
        >
          <ScrollAreaDemo />
        </PreviewCard>

        <PreviewCard
          name="Collapsible"
          path="@codefast/ui/collapsible"
          description="Togglable content section with animated expand/collapse. Controlled or uncontrolled."
          code={collapsibleDemoCode}
          highlightedCode={hl.collapsible}
        >
          <CollapsibleDemo />
        </PreviewCard>

        <PreviewCard
          name="Resizable"
          path="@codefast/ui/resizable"
          description="Drag-to-resize panel groups. Supports horizontal, vertical, and nested layouts."
          wide
          code={resizableDemoCode}
          highlightedCode={hl.resizable}
        >
          <ResizableDemo />
        </PreviewCard>
      </Section>
    </main>
  );
}
