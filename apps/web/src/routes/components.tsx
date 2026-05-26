"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Badge } from "@codefast/ui/badge";
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
  InfoIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  TerminalIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
} from "lucide-react";

export const Route = createFileRoute("/components")({ component: ComponentsPage });

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const CATEGORIES = [
  { id: "display", label: "Display" },
  { id: "form", label: "Form" },
  { id: "navigation", label: "Navigation" },
  { id: "overlay", label: "Overlay" },
  { id: "feedback", label: "Feedback" },
  { id: "layout", label: "Layout" },
] as const;

interface PreviewCardProps {
  name: string;
  path: string;
  description: string;
  children: React.ReactNode;
  wide?: boolean;
}

function PreviewCard({ name, path, description, children, wide }: PreviewCardProps) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] ${wide ? "sm:col-span-2" : ""}`}
    >
      <div className="flex min-h-40 flex-1 items-center justify-center bg-[var(--chip-bg)] p-6">
        {children}
      </div>
      <div className="border-t border-[var(--line)] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--sea-ink)]">{name}</p>
          <code className="rounded border border-[var(--line)] bg-[var(--chip-bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--sea-ink-soft)]">
            {path}
          </code>
        </div>
        <p className="mt-0.5 text-xs leading-5 text-[var(--sea-ink-soft)]">{description}</p>
      </div>
    </div>
  );
}

interface SectionProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} className="mb-20">
      <div className="mb-8 border-b border-[var(--line)] pb-6">
        <p className="island-kicker mb-2">{id}</p>
        <h2 className="display-title text-2xl font-bold text-[var(--sea-ink)]">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-[var(--sea-ink-soft)]">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

function ComponentsPage() {
  const [checked, setChecked] = useState(false);
  const [switched, setSwitched] = useState(true);
  const [sliderValue, setSliderValue] = useState([60]);
  const [progress] = useState(68);
  const [radio, setRadio] = useState("comfortable");

  return (
    <main className="page-wrap px-4 pt-12 pb-24">
      {/* Header */}
      <section className="rise-in mb-16 max-w-2xl">
        <Badge variant="outline" className="mb-5 border-[var(--line)] text-[var(--sea-ink-soft)]">
          Components
        </Badge>
        <h1 className="display-title mb-5 text-[clamp(40px,5vw,64px)] font-bold text-[var(--sea-ink)]">
          60+ ready-to-use{" "}
          <span className="bg-gradient-to-br from-[var(--lagoon)] to-[var(--lagoon-deep)] bg-clip-text text-transparent">
            components.
          </span>
        </h1>
        <p className="text-[17px] leading-relaxed text-[var(--sea-ink-soft)]">
          Built on Radix UI primitives, styled with Tailwind CSS v4. Every component is accessible,
          composable, and fully typed — copy the source and own it.
        </p>
      </section>

      {/* Category quick-nav */}
      <nav className="mb-16 flex flex-wrap gap-2" aria-label="Component categories">
        {CATEGORIES.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-1.5 text-xs font-semibold text-[var(--sea-ink-soft)] no-underline transition-colors hover:border-[var(--lagoon)] hover:text-[var(--sea-ink)]"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* ── Display ─────────────────────────────────────────────────────── */}
      <Section
        id="display"
        title="Display"
        description="Presentational components for surfacing information and state."
      >
        <PreviewCard
          name="Badge"
          path="@codefast/ui/badge"
          description="Small status indicator with multiple variants."
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
          description="Contextual message with icon, title, and description."
          wide
        >
          <div className="w-full max-w-sm space-y-3">
            <Alert>
              <InfoIcon />
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
            </Alert>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Avatar"
          path="@codefast/ui/avatar"
          description="User avatar with image, fallback initials, and sizing."
        >
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback>VP</AvatarFallback>
            </Avatar>
            <Avatar className="size-10 bg-[var(--lagoon)] text-white">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Avatar className="size-10 bg-[var(--palm)] text-white">
              <AvatarFallback>AS</AvatarFallback>
            </Avatar>
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">SM</AvatarFallback>
            </Avatar>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Skeleton"
          path="@codefast/ui/skeleton"
          description="Animated loading placeholder for any content shape."
        >
          <div className="flex w-full max-w-xs items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4 rounded-full" />
              <Skeleton className="h-3 w-1/2 rounded-full" />
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Spinner"
          path="@codefast/ui/spinner"
          description="Indeterminate loading indicator with configurable size."
        >
          <div className="flex items-center gap-5">
            <Spinner className="size-4" />
            <Spinner className="size-6" />
            <Spinner className="size-8" />
          </div>
        </PreviewCard>

        <PreviewCard
          name="Kbd"
          path="@codefast/ui/kbd"
          description="Keyboard shortcut display with styled key combos."
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

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <Section
        id="form"
        title="Form"
        description="Input primitives for collecting user data — all keyboard and screen-reader accessible."
      >
        <PreviewCard
          name="Input"
          path="@codefast/ui/input"
          description="Text input field with focus ring and disabled state."
        >
          <Input placeholder="Enter your email…" className="max-w-xs" type="email" />
        </PreviewCard>

        <PreviewCard
          name="Textarea"
          path="@codefast/ui/textarea"
          description="Multiline text input with auto-resize support."
        >
          <Textarea
            placeholder="Tell us a bit about yourself…"
            className="max-w-xs resize-none"
            rows={3}
          />
        </PreviewCard>

        <PreviewCard
          name="Select"
          path="@codefast/ui/select"
          description="Accessible dropdown selector built on Radix Select."
        >
          <Select>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Pick a framework" />
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
          description="Binary on/off control with indeterminate state support."
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="terms" checked={checked} onCheckedChange={(v) => setChecked(!!v)} />
              <Label htmlFor="terms">Accept terms and conditions</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="newsletter" defaultChecked />
              <Label htmlFor="newsletter">Subscribe to newsletter</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="disabled" disabled />
              <Label htmlFor="disabled" className="opacity-50">
                Disabled option
              </Label>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Radio Group"
          path="@codefast/ui/radio-group"
          description="Single-selection group built on Radix RadioGroup."
        >
          <RadioGroup value={radio} onValueChange={setRadio} className="gap-3">
            {["compact", "comfortable", "spacious"].map((v) => (
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
          description="Toggle control for boolean settings."
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Switch id="notifications" checked={switched} onCheckedChange={setSwitched} />
              <Label htmlFor="notifications">Notifications {switched ? "on" : "off"}</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="dark-mode" defaultChecked />
              <Label htmlFor="dark-mode">Dark mode</Label>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Slider"
          path="@codefast/ui/slider"
          description="Range input with keyboard support and custom step."
        >
          <div className="w-full max-w-xs space-y-3">
            <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
            <p className="text-center text-xs text-[var(--sea-ink-soft)]">
              Value: {sliderValue[0]}
            </p>
          </div>
        </PreviewCard>

        <PreviewCard
          name="Toggle"
          path="@codefast/ui/toggle"
          description="Pressable button that alternates between active and inactive."
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

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <Section
        id="navigation"
        title="Navigation"
        description="Components for moving between views, routes, and pages."
      >
        <PreviewCard
          name="Tabs"
          path="@codefast/ui/tabs"
          description="Accessible tabbed interface built on Radix Tabs."
          wide
        >
          <Tabs defaultValue="preview" className="w-full max-w-sm">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="docs">Docs</TabsTrigger>
            </TabsList>
            <TabsContent
              value="preview"
              className="mt-3 rounded-lg border border-[var(--line)] p-4 text-sm text-[var(--sea-ink-soft)]"
            >
              Live component preview renders here.
            </TabsContent>
            <TabsContent
              value="code"
              className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--code-surface)] p-4 font-mono text-xs text-[#b2e8e4]"
            >
              {`<Button variant="outline">Click me</Button>`}
            </TabsContent>
            <TabsContent
              value="docs"
              className="mt-3 rounded-lg border border-[var(--line)] p-4 text-sm text-[var(--sea-ink-soft)]"
            >
              Full API reference and usage examples.
            </TabsContent>
          </Tabs>
        </PreviewCard>

        <PreviewCard
          name="Breadcrumb"
          path="@codefast/ui/breadcrumb"
          description="Hierarchical location trail for multi-level navigation."
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
          description="Page navigation controls with previous, next, and ellipsis."
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

      {/* ── Overlay ─────────────────────────────────────────────────────── */}
      <Section
        id="overlay"
        title="Overlay"
        description="Floating UI elements — modals, tooltips, popovers, and menus."
      >
        <PreviewCard
          name="Dialog"
          path="@codefast/ui/dialog"
          description="Modal window with focus trap, backdrop, and animation."
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="dialog-name">Name</Label>
                  <Input id="dialog-name" defaultValue="Vuong Phan" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="dialog-username">Username</Label>
                  <Input id="dialog-username" defaultValue="@vuongphan" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
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
          description="Hover label revealing additional context for an element."
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
          description="Non-modal floating panel anchored to a trigger element."
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--sea-ink)]">Dimensions</h4>
                  <p className="text-xs text-[var(--sea-ink-soft)]">
                    Set the container dimensions.
                  </p>
                </div>
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
          description="Contextual action menu with keyboard navigation support."
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Log out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PreviewCard>
      </Section>

      {/* ── Feedback ────────────────────────────────────────────────────── */}
      <Section
        id="feedback"
        title="Feedback"
        description="Components that communicate status, confirm actions, and show async state."
      >
        <PreviewCard
          name="Progress"
          path="@codefast/ui/progress"
          description="Determinate progress bar tracking completion percentage."
        >
          <div className="w-full max-w-xs space-y-3">
            <Progress value={progress} />
            <div className="flex justify-between text-xs text-[var(--sea-ink-soft)]">
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <Progress value={33} className="[&_[data-slot=progress-indicator]]:bg-amber-500" />
            <Progress value={100} className="[&_[data-slot=progress-indicator]]:bg-emerald-500" />
          </div>
        </PreviewCard>

        <PreviewCard
          name="Alert Dialog"
          path="@codefast/ui/alert-dialog"
          description="Blocking confirmation modal that requires an explicit user decision."
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
                  This action cannot be undone. This will permanently delete your account and remove
                  your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </PreviewCard>

        <PreviewCard
          name="Skeleton"
          path="@codefast/ui/skeleton"
          description="Shimmer placeholder for content that's still loading."
          wide
        >
          <div className="grid w-full max-w-sm gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-3 w-3/4 rounded-full" />
              <Skeleton className="h-3 w-1/2 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-3 w-2/3 rounded-full" />
              <Skeleton className="h-3 w-5/6 rounded-full" />
            </div>
          </div>
        </PreviewCard>
      </Section>

      {/* ── Layout ──────────────────────────────────────────────────────── */}
      <Section
        id="layout"
        title="Layout"
        description="Structural components for organizing and containing content."
      >
        <PreviewCard
          name="Card"
          path="@codefast/ui/card"
          description="Elevated surface grouping related content with header and body."
        >
          <Card className="w-full max-w-xs">
            <CardHeader>
              <CardTitle>Team plan</CardTitle>
              <CardDescription>Up to 20 seats, unlimited projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--sea-ink)]">
                $49<span className="text-sm font-normal text-[var(--sea-ink-soft)]">/mo</span>
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
          description="Expandable sections for progressive disclosure of content."
          wide
        >
          <Accordion type="single" collapsible className="w-full max-w-sm">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes. It adheres to the WAI-ARIA design pattern and supports full keyboard
                navigation.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>
                Yes. It comes with default styles that match the rest of the component library.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I customise it?</AccordionTrigger>
              <AccordionContent>
                Yes. Every component exposes a <code>className</code> prop and you own the source.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </PreviewCard>

        <PreviewCard
          name="Separator"
          path="@codefast/ui/separator"
          description="Horizontal or vertical divider between content regions."
        >
          <div className="w-full max-w-xs">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-[var(--sea-ink)]">@codefast/ui</h4>
              <p className="text-xs text-[var(--sea-ink-soft)]">
                An open-source UI component library.
              </p>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center gap-4 text-xs text-[var(--sea-ink-soft)]">
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
          description="Custom-styled scrollable container with overflow clipping."
        >
          <ScrollArea className="h-36 w-48 rounded-xl border border-[var(--line)] p-3">
            <div className="space-y-2">
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
                <p key={item} className="text-xs text-[var(--sea-ink-soft)]">
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
