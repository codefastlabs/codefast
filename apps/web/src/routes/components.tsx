import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Badge } from "@codefast/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@codefast/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@codefast/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@codefast/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@codefast/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@codefast/ui/breadcrumb";
import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Checkbox } from "@codefast/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@codefast/ui/dialog";
import { Input } from "@codefast/ui/input";
import { Kbd, KbdGroup } from "@codefast/ui/kbd";
import { Label } from "@codefast/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@codefast/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { Progress } from "@codefast/ui/progress";
import { RadioGroup, RadioGroupItem } from "@codefast/ui/radio-group";
import { ScrollArea } from "@codefast/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@codefast/ui/select";
import { Separator } from "@codefast/ui/separator";
import { Skeleton } from "@codefast/ui/skeleton";
import { Slider } from "@codefast/ui/slider";
import { Spinner } from "@codefast/ui/spinner";
import { Switch } from "@codefast/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import { Textarea } from "@codefast/ui/textarea";
import { Toggle } from "@codefast/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@codefast/ui/dropdown-menu";
import {
  AlertTriangleIcon,
  BoldIcon,
  ChevronRightIcon,
  InfoIcon,
  ItalicIcon,
  TerminalIcon,
  UnderlineIcon,
} from "lucide-react";
import { PreviewCard } from "#/components/PreviewCard";
import { ALL_COMPONENTS } from "#/data/components";
import type { CategoryId } from "#/data/components";

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

// CategoryId and ALL_COMPONENTS are imported from #/data/components (single source of truth)
type FilterId = "all" | CategoryId;

const CATEGORY_COUNTS = Object.fromEntries(
  CATEGORIES.map(({ id }): [CategoryId, number] => [
    id,
    ALL_COMPONENTS.filter((c) => c.category === id).length,
  ]),
) as Record<CategoryId, number>;

type FilterOption = { readonly id: FilterId; readonly label: string };

const FILTER_OPTIONS: ReadonlyArray<FilterOption> = [{ id: "all", label: "All" }, ...CATEGORIES];

const DENSITY_OPTIONS = ["compact", "comfortable", "spacious"] as const;
type Density = (typeof DENSITY_OPTIONS)[number];

// Type guard for the Radix RadioGroup boundary (onValueChange types as string)
const DENSITY_SET = new Set<string>(DENSITY_OPTIONS);
const isDensity = (v: string): v is Density => DENSITY_SET.has(v);

function ComponentsPage() {
  const [checked, setChecked] = useState(false);
  const [switched, setSwitched] = useState(true);
  const [sliderValue, setSliderValue] = useState([60]);
  const [radio, setRadio] = useState<Density>("comfortable");
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
          code={`import { Badge } from "@codefast/ui/badge";

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>`}
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Alert"
          path="@codefast/ui/alert"
          description="Contextual banner with icon, title, and body. Supports default and destructive variants."
          wide
          code={`import { Alert, AlertTitle, AlertDescription } from "@codefast/ui/alert";
import { InfoIcon, AlertTriangleIcon } from "lucide-react";

<Alert>
  <InfoIcon />
  <AlertTitle>Heads up</AlertTitle>
  <AlertDescription>
    You can add components using the CLI.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertTriangleIcon />
  <AlertTitle>Session expired</AlertTitle>
  <AlertDescription>Please log in again.</AlertDescription>
</Alert>`}
        >
          <div className="w-full max-w-sm space-y-3">
            <Alert>
              <InfoIcon />
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>You can add components using the CLI.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertTitle>Session expired</AlertTitle>
              <AlertDescription>Please log in again.</AlertDescription>
            </Alert>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Avatar"
          path="@codefast/ui/avatar"
          description="User icon with image support and initials fallback. Compose with AvatarGroup for stacks."
          code={`import { Avatar, AvatarImage, AvatarFallback } from "@codefast/ui/avatar";

<Avatar>
  <AvatarImage src="/avatar.png" alt="Vuong Phan" />
  <AvatarFallback>VP</AvatarFallback>
</Avatar>`}
        >
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback>VP</AvatarFallback>
            </Avatar>
            <Avatar className="size-10">
              <AvatarFallback className="bg-(--lagoon) text-white">JD</AvatarFallback>
            </Avatar>
            <Avatar className="size-10">
              <AvatarFallback className="bg-violet-500 text-white">AS</AvatarFallback>
            </Avatar>
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">SM</AvatarFallback>
            </Avatar>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Spinner"
          path="@codefast/ui/spinner"
          description="Indeterminate loading indicator. Wrap children — shown when loading is false."
          code={`import { Spinner } from "@codefast/ui/spinner";

// Standalone
<Spinner className="size-5" />

// Wrapping content — hides children while loading
<Spinner loading={isLoading}>
  <span>Loaded content</span>
</Spinner>`}
        >
          <div className="flex items-center gap-6">
            <Spinner className="size-4" />
            <Spinner className="size-6" />
            <Spinner className="size-8" />
          </div>
        </PreviewCard>

        <PreviewCard
          name="Kbd"
          path="@codefast/ui/kbd"
          description="Keyboard shortcut display. Use KbdGroup to compose multi-key combos."
          code={`import { Kbd, KbdGroup } from "@codefast/ui/kbd";

// Single key
<Kbd>⌘</Kbd>

// Combo
<KbdGroup>
  <Kbd>⌘</Kbd>
  <Kbd>K</Kbd>
</KbdGroup>

// Tooltip integration
<TooltipContent>
  Open palette <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
</TooltipContent>`}
        >
          <div className="flex flex-col items-center gap-3">
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>Shift</Kbd>
              <Kbd>P</Kbd>
            </KbdGroup>
          </div>
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
          code={`import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";

<div className="grid gap-1.5">
  <Label htmlFor="email">Email address</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

// With error state
<Input aria-invalid="true" placeholder="Invalid input" />`}
        >
          <div className="w-full max-w-xs space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="preview-email">Email address</Label>
              <Input id="preview-email" type="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="preview-password">Password</Label>
              <Input id="preview-password" type="password" placeholder="••••••••" />
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Textarea"
          path="@codefast/ui/textarea"
          description="Multiline text input. Pair with Label and field utilities for accessible forms."
          code={`import { Textarea } from "@codefast/ui/textarea";
import { Label } from "@codefast/ui/label";

<div className="grid gap-1.5">
  <Label htmlFor="bio">Bio</Label>
  <Textarea
    id="bio"
    placeholder="Tell us about yourself…"
    className="resize-none"
    rows={4}
  />
</div>`}
        >
          <Textarea
            placeholder="Tell us about yourself…"
            className="max-w-xs resize-none"
            rows={3}
          />
        </PreviewCard>

        <PreviewCard
          name="Select"
          path="@codefast/ui/select"
          description="Accessible dropdown selector. Supports groups, disabled options, and custom triggers."
          code={`import {
  Select, SelectContent, SelectGroup,
  SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@codefast/ui/select";

<Select>
  <SelectTrigger className="w-44">
    <SelectValue placeholder="Choose framework" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Frontend</SelectLabel>
      <SelectItem value="react">React</SelectItem>
      <SelectItem value="vue">Vue</SelectItem>
      <SelectItem value="svelte">Svelte</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`}
        >
          <Select>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Choose framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="vue">Vue</SelectItem>
              <SelectItem value="svelte">Svelte</SelectItem>
              <SelectItem value="solid">Solid</SelectItem>
            </SelectContent>
          </Select>
        </PreviewCard>

        <PreviewCard
          name="Checkbox"
          path="@codefast/ui/checkbox"
          description="Binary control with indeterminate state. Controlled or uncontrolled via onCheckedChange."
          code={`import { Checkbox } from "@codefast/ui/checkbox";
import { Label } from "@codefast/ui/label";

// Uncontrolled
<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms</Label>
</div>

// Controlled
const [checked, setChecked] = useState(false);
<Checkbox
  checked={checked}
  onCheckedChange={(v) => setChecked(!!v)}
/>`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="c1" checked={checked} onCheckedChange={(v) => setChecked(!!v)} />
              <Label htmlFor="c1">Accept terms and conditions</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="c2" defaultChecked />
              <Label htmlFor="c2">Subscribe to newsletter</Label>
            </div>
            <div className="flex items-center gap-2 opacity-50">
              <Checkbox id="c3" disabled />
              <Label htmlFor="c3">Disabled option</Label>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Radio Group"
          path="@codefast/ui/radio-group"
          description="Single-selection group. Use value + onValueChange for controlled behaviour."
          code={`import { RadioGroup, RadioGroupItem } from "@codefast/ui/radio-group";
import { Label } from "@codefast/ui/label";

<RadioGroup
  value={density}
  onValueChange={setDensity}
  className="gap-3"
>
  {["compact", "comfortable", "spacious"].map((v) => (
    <div key={v} className="flex items-center gap-2">
      <RadioGroupItem value={v} id={v} />
      <Label htmlFor={v} className="capitalize">{v}</Label>
    </div>
  ))}
</RadioGroup>`}
        >
          <RadioGroup
            value={radio}
            onValueChange={(v) => {
              if (isDensity(v)) {
                setRadio(v);
              }
            }}
            className="gap-3"
          >
            {DENSITY_OPTIONS.map((v) => (
              <div key={v} className="flex items-center gap-2">
                <RadioGroupItem value={v} id={`radio-${v}`} />
                <Label htmlFor={`radio-${v}`} className="capitalize">
                  {v}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </PreviewCard>

        <PreviewCard
          name="Switch"
          path="@codefast/ui/switch"
          description="Toggle control for boolean settings. Fires onCheckedChange with the new boolean value."
          code={`import { Switch } from "@codefast/ui/switch";
import { Label } from "@codefast/ui/label";

const [enabled, setEnabled] = useState(true);

<div className="flex items-center gap-3">
  <Switch
    id="notifications"
    checked={enabled}
    onCheckedChange={setEnabled}
  />
  <Label htmlFor="notifications">
    Notifications {enabled ? "on" : "off"}
  </Label>
</div>`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch id="sw1" checked={switched} onCheckedChange={setSwitched} />
              <Label htmlFor="sw1">Notifications {switched ? "on" : "off"}</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="sw2" defaultChecked />
              <Label htmlFor="sw2">Marketing emails</Label>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Slider"
          path="@codefast/ui/slider"
          description="Range input with keyboard support. Supports min, max, step, and multiple thumbs."
          code={`import { Slider } from "@codefast/ui/slider";

const [value, setValue] = useState([60]);

<Slider
  value={value}
  onValueChange={setValue}
  max={100}
  step={1}
  className="w-full"
/>
<p className="text-sm">{value[0]}%</p>

// Range (two thumbs)
<Slider defaultValue={[20, 80]} max={100} step={5} />`}
        >
          <div className="w-full max-w-xs space-y-3">
            <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
            <p className="text-center text-xs text-(--sea-ink-soft)">Value: {sliderValue[0]}</p>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Toggle"
          path="@codefast/ui/toggle"
          description="Pressable button with active/inactive state. Use ToggleGroup for exclusive selection."
          code={`import { Toggle } from "@codefast/ui/toggle";
import { BoldIcon, ItalicIcon } from "lucide-react";

// Icon toggles
<div className="flex gap-1">
  <Toggle aria-label="Bold"><BoldIcon /></Toggle>
  <Toggle aria-label="Italic" defaultPressed>
    <ItalicIcon />
  </Toggle>
</div>

// With text
<Toggle variant="outline">
  <BoldIcon /> Bold
</Toggle>`}
        >
          <div className="flex gap-1">
            <Toggle aria-label="Bold" size="sm">
              <BoldIcon />
            </Toggle>
            <Toggle aria-label="Italic" size="sm" defaultPressed>
              <ItalicIcon />
            </Toggle>
            <Toggle aria-label="Underline" size="sm">
              <UnderlineIcon />
            </Toggle>
          </div>
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
          code={`import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";

<Tabs defaultValue="preview">
  <TabsList>
    <TabsTrigger value="preview">Preview</TabsTrigger>
    <TabsTrigger value="code">Code</TabsTrigger>
    <TabsTrigger value="docs">Docs</TabsTrigger>
  </TabsList>
  <TabsContent value="preview">
    Live render goes here.
  </TabsContent>
  <TabsContent value="code">
    <pre><code>{"<Button>Click me</Button>"}</code></pre>
  </TabsContent>
  <TabsContent value="docs">
    API reference.
  </TabsContent>
</Tabs>`}
        >
          <Tabs defaultValue="preview" className="w-full max-w-sm">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="docs">Docs</TabsTrigger>
            </TabsList>
            <TabsContent
              value="preview"
              className="mt-3 rounded-lg border border-(--line) p-4 text-sm text-(--sea-ink-soft)"
            >
              Live component preview renders here.
            </TabsContent>
            <TabsContent value="code" className="mt-3 overflow-hidden rounded-lg">
              <pre className="bg-(--code-surface) p-4 font-mono text-xs text-(--code-text)">
                <code>{`<Button variant="outline">Click me</Button>`}</code>
              </pre>
            </TabsContent>
            <TabsContent
              value="docs"
              className="mt-3 rounded-lg border border-(--line) p-4 text-sm text-(--sea-ink-soft)"
            >
              Full API reference and usage examples.
            </TabsContent>
          </Tabs>
        </PreviewCard>

        <PreviewCard
          name="Breadcrumb"
          path="@codefast/ui/breadcrumb"
          description="Hierarchical location trail. Supports custom separators, ellipsis, and asChild links."
          code={`import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@codefast/ui/breadcrumb";
import { ChevronRightIcon } from "lucide-react";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator>
      <ChevronRightIcon />
    </BreadcrumbSeparator>
    <BreadcrumbItem>
      <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator>
      <ChevronRightIcon />
    </BreadcrumbSeparator>
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`}
        >
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRightIcon />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink href="/components">Components</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRightIcon />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PreviewCard>

        <PreviewCard
          name="Pagination"
          path="@codefast/ui/pagination"
          description="Page navigation with prev/next, ellipsis, and active page. Compose with your router."
          code={`import {
  Pagination, PaginationContent, PaginationEllipsis,
  PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@codefast/ui/pagination";

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="?page=1" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="?page=1">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="?page=2" isActive>2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="?page=3" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`}
        >
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
          code={`import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@codefast/ui/dialog";
import { Button } from "@codefast/ui/button";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Edit profile</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Changes are saved automatically.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-3 py-2">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" defaultValue="Vuong Phan" />
      </div>
    </div>
  </DialogContent>
</Dialog>`}
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>Make changes here. Click save when done.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="dialog-name">Name</Label>
                  <Input id="dialog-name" defaultValue="Vuong Phan" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dialog-user">Username</Label>
                  <Input id="dialog-user" defaultValue="@vuongphan" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
                <Button size="sm">Save changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </PreviewCard>

        <PreviewCard
          name="Tooltip"
          path="@codefast/ui/tooltip"
          description="Hover label with delay and side placement control. Supports rich content including Kbd."
          code={`import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@codefast/ui/tooltip";
import { Kbd, KbdGroup } from "@codefast/ui/kbd";

// Wrap your app (or layout) once
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline">Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Open command palette</p>
      <KbdGroup>
        <Kbd>⌘</Kbd><Kbd>K</Kbd>
      </KbdGroup>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`}
        >
          <TooltipProvider>
            <div className="flex gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <TerminalIcon />
                    CLI
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open terminal</p>
                  <KbdGroup>
                    <Kbd>⌘</Kbd>
                    <Kbd>`</Kbd>
                  </KbdGroup>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <InfoIcon />
                    Info
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>More information</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </PreviewCard>

        <PreviewCard
          name="Popover"
          path="@codefast/ui/popover"
          description="Non-modal floating panel anchored to a trigger. Use for settings panels and pickers."
          code={`import { Popover, PopoverContent, PopoverTrigger } from "@codefast/ui/popover";
import { Button } from "@codefast/ui/button";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open</Button>
  </PopoverTrigger>
  <PopoverContent className="w-64">
    <div className="grid gap-4">
      <p className="text-sm font-medium">Dimensions</p>
      <div className="grid gap-2">
        <div className="grid grid-cols-3 items-center gap-3">
          <Label>Width</Label>
          <Input defaultValue="100%" className="col-span-2 h-7 text-xs" />
        </div>
      </div>
    </div>
  </PopoverContent>
</Popover>`}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="grid gap-3">
                <p className="text-sm font-medium text-(--sea-ink)">Dimensions</p>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label className="text-xs">Width</Label>
                    <Input defaultValue="100%" className="col-span-2 h-7 text-xs" />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label className="text-xs">Height</Label>
                    <Input defaultValue="auto" className="col-span-2 h-7 text-xs" />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </PreviewCard>

        <PreviewCard
          name="Dropdown Menu"
          path="@codefast/ui/dropdown-menu"
          description="Contextual action menu with keyboard navigation, shortcuts, checkboxes, and radio groups."
          code={`import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuShortcut, DropdownMenuTrigger,
} from "@codefast/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-48">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      Profile <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      Log out <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profile<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings<DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Log out<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          code={`import { Progress } from "@codefast/ui/progress";

// Basic
<Progress value={68} />

// Custom colour via data-slot
<Progress
  value={33}
  className="**:data-[slot=progress-indicator]:bg-amber-500"
/>

// Success state
<Progress
  value={100}
  className="**:data-[slot=progress-indicator]:bg-emerald-500"
/>`}
        >
          <div className="w-full max-w-xs space-y-3">
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-(--sea-ink-soft)">
                <span>Uploading…</span>
                <span>68%</span>
              </div>
              <Progress value={68} />
            </div>
            <Progress value={33} className="**:data-[slot=progress-indicator]:bg-amber-500" />
            <Progress value={100} className="**:data-[slot=progress-indicator]:bg-emerald-500" />
          </div>
        </PreviewCard>

        <PreviewCard
          name="Alert Dialog"
          path="@codefast/ui/alert-dialog"
          description="Blocking confirmation modal requiring an explicit decision. Backs the browser back button."
          code={`import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@codefast/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Your account will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </PreviewCard>

        <PreviewCard
          name="Skeleton"
          path="@codefast/ui/skeleton"
          description="Shimmer placeholder for any shape of content — cards, text lines, avatars."
          wide
          code={`import { Skeleton } from "@codefast/ui/skeleton";

// Article card skeleton
<div className="grid gap-4 sm:grid-cols-2">
  {[1, 2].map((i) => (
    <div key={i} className="space-y-2">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-3 w-3/4 rounded-full" />
      <Skeleton className="h-3 w-1/2 rounded-full" />
    </div>
  ))}
</div>`}
        >
          <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-xl bg-(--surface) p-3 shadow-sm ring-1 ring-(--line)">
                <Skeleton className="mb-3 h-24 w-full rounded-lg" />
                <div className="mb-3 flex items-center gap-2">
                  <Skeleton className="size-7 shrink-0 rounded-full" />
                  <Skeleton className="h-2.5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-2 w-3/4 rounded-full" />
                <Skeleton className="mt-1.5 h-2 w-1/2 rounded-full" />
              </div>
            ))}
          </div>
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
          code={`import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from "@codefast/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Team plan</CardTitle>
    <CardDescription>Up to 20 seats, unlimited projects.</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">
      $49<span className="text-sm font-normal text-muted-foreground">/mo</span>
    </p>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Upgrade now</Button>
  </CardFooter>
</Card>`}
        >
          <Card className="w-full max-w-xs">
            <CardHeader>
              <CardTitle>Team plan</CardTitle>
              <CardDescription>Up to 20 seats, unlimited projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-(--sea-ink)">
                $49<span className="text-sm font-normal text-(--sea-ink-soft)">/mo</span>
              </p>
              <Button className="mt-4 w-full" size="sm">
                Upgrade now
              </Button>
            </CardContent>
          </Card>
        </PreviewCard>

        <PreviewCard
          name="Accordion"
          path="@codefast/ui/accordion"
          description="Expandable sections with smooth animation. Supports single or multiple open items."
          wide
          code={`import {
  Accordion, AccordionContent,
  AccordionItem, AccordionTrigger,
} from "@codefast/ui/accordion";

// Single open at a time
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. Follows the WAI-ARIA disclosure pattern.
    </AccordionContent>
  </AccordionItem>
</Accordion>

// Multiple open simultaneously
<Accordion type="multiple">
  ...
</Accordion>`}
        >
          <Accordion type="single" collapsible className="w-full max-w-sm">
            <AccordionItem value="q1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes. It follows the WAI-ARIA design pattern with full keyboard navigation.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>Can I customise styles?</AccordionTrigger>
              <AccordionContent>
                Yes. Every component exposes a className prop and you own the source.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>Does it work with SSR?</AccordionTrigger>
              <AccordionContent>
                Yes. All components render server-side with no hydration issues.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </PreviewCard>

        <PreviewCard
          name="Separator"
          path="@codefast/ui/separator"
          description="Semantic horizontal or vertical divider. Renders as hr with role=separator."
          code={`import { Separator } from "@codefast/ui/separator";

// Horizontal (default)
<Separator />

// Vertical
<div className="flex h-5 items-center gap-4 text-sm">
  <span>Blog</span>
  <Separator orientation="vertical" />
  <span>Docs</span>
  <Separator orientation="vertical" />
  <span>GitHub</span>
</div>`}
        >
          <div className="w-full max-w-xs">
            <div className="space-y-1">
              <p className="text-sm font-medium text-(--sea-ink)">@codefast/ui</p>
              <p className="text-xs text-(--sea-ink-soft)">Open-source React components.</p>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center gap-4 text-xs text-(--sea-ink-soft)">
              <span>Blog</span>
              <Separator orientation="vertical" className="h-3" />
              <span>Docs</span>
              <Separator orientation="vertical" className="h-3" />
              <span>Source</span>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Scroll Area"
          path="@codefast/ui/scroll-area"
          description="Custom-styled scrollbar that matches your design system. Hides native OS scrollbars."
          code={`import { ScrollArea } from "@codefast/ui/scroll-area";

// Fixed-height scrollable list
<ScrollArea className="h-48 rounded-xl border p-4">
  {items.map((item) => (
    <div key={item} className="text-sm py-1">
      {item}
    </div>
  ))}
</ScrollArea>

// Horizontal scroll
<ScrollArea className="w-64" orientation="horizontal">
  <div className="flex gap-4 pb-2">...</div>
</ScrollArea>`}
        >
          <ScrollArea className="h-36 w-48 rounded-xl border border-(--line) p-3">
            <div className="space-y-1.5">
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
              ].map((item) => (
                <p key={item} className="text-xs text-(--sea-ink-soft)">
                  {item}
                </p>
              ))}
            </div>
          </ScrollArea>
        </PreviewCard>
      </Section>
    </main>
  );
}
