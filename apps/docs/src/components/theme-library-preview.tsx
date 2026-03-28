"use client";

import { Alert, AlertDescription, AlertTitle } from "@codefast/ui/alert";
import { Avatar, AvatarFallback } from "@codefast/ui/avatar";
import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { ButtonGroup } from "@codefast/ui/button-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Checkbox } from "@codefast/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@codefast/ui/dropdown-menu";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@codefast/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@codefast/ui/input-group";
import { Label } from "@codefast/ui/label";
import { Progress } from "@codefast/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@codefast/ui/select";
import { Separator } from "@codefast/ui/separator";
import { Skeleton } from "@codefast/ui/skeleton";
import { Switch } from "@codefast/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import { Textarea } from "@codefast/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@codefast/ui/tooltip";
import { cn } from "@codefast/tailwind-variants";
import {
  BellIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CopyIcon,
  InfoIcon,
  LockIcon,
  MailIcon,
  MoreHorizontalIcon,
  SearchIcon,
  SendIcon,
  Share2Icon,
  SparklesIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { type JSX, useState } from "react";

export function ThemeLibraryPreview(): JSX.Element {
  const [productUpdates, setProductUpdates] = useState(true);
  const [framework, setFramework] = useState("react");

  return (
    <Card className="border-border/60 shadow-md ring-1 ring-border/35">
      <CardContent className="p-4 md:p-6">
        <Tabs defaultValue="forms">
          <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted/40 p-1 sm:grid-cols-4 sm:gap-1">
            <TabsTrigger value="forms" className="rounded-lg">
              Forms
            </TabsTrigger>
            <TabsTrigger value="actions" className="rounded-lg">
              Actions
            </TabsTrigger>
            <TabsTrigger value="feedback" className="rounded-lg">
              Feedback
            </TabsTrigger>
            <TabsTrigger value="surfaces" className="rounded-lg">
              Surfaces
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forms" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              <div className="space-y-6">
                <div
                  className={cn(
                    "rounded-2xl border border-border/50 bg-linear-to-br from-card via-card to-muted/25 p-5 shadow-sm ring-1 ring-border/30",
                    "dark:from-card dark:via-card dark:to-muted/15",
                  )}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <SearchIcon className="size-3.5 text-primary" aria-hidden />
                    Command palette style
                  </div>
                  <InputGroup className="mt-4 shadow-xs">
                    <InputGroupAddon align="inline-start">
                      <SearchIcon className="text-muted-foreground" aria-hidden />
                    </InputGroupAddon>
                    <InputGroupInput placeholder="Jump to route, token, or snippet…" />
                    <InputGroupAddon align="inline-end">
                      <kbd className="pointer-events-none hidden rounded border border-border/80 bg-muted/80 px-1.5 py-0.5 font-mono text-[0.65rem] font-medium text-muted-foreground sm:inline">
                        ⌘K
                      </kbd>
                    </InputGroupAddon>
                  </InputGroup>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Input group addons pick up focus rings and border tokens in both modes.
                  </p>
                </div>

                <FieldGroup className="gap-5">
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="lib-preview-notify">Product updates</FieldLabel>
                    <FieldContent>
                      <Switch
                        id="lib-preview-notify"
                        checked={productUpdates}
                        onCheckedChange={setProductUpdates}
                        aria-label="Toggle product update emails"
                      />
                    </FieldContent>
                  </Field>
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="lib-preview-fw">Stack</FieldLabel>
                    <FieldContent className="min-w-48">
                      <Select value={framework} onValueChange={setFramework}>
                        <SelectTrigger id="lib-preview-fw" className="w-full">
                          <SelectValue placeholder="Framework" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="react">React</SelectItem>
                          <SelectItem value="vue">Vue</SelectItem>
                          <SelectItem value="svelte">Svelte</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                  <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/15 px-3 py-3">
                    <Checkbox id="lib-preview-terms" defaultChecked className="mt-0.5" />
                    <Label
                      htmlFor="lib-preview-terms"
                      className="text-sm leading-snug font-normal text-muted-foreground"
                    >
                      Share anonymous usage to improve docs
                    </Label>
                  </div>
                </FieldGroup>
              </div>

              <div className="space-y-5">
                <Card className="overflow-hidden border-border/60 shadow-md ring-1 ring-primary/15">
                  <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <MailIcon className="size-4" aria-hidden />
                      </div>
                      <div>
                        <CardTitle className="text-base">Sign in</CardTitle>
                        <CardDescription>Minimal auth surface — tokens only</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    <div className="grid gap-2">
                      <Label htmlFor="lib-preview-email">Work email</Label>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <MailIcon className="text-muted-foreground" aria-hidden />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="lib-preview-email"
                          type="email"
                          placeholder="you@team.example"
                          autoComplete="email"
                        />
                      </InputGroup>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lib-preview-pass">Password</Label>
                      <InputGroup>
                        <InputGroupAddon align="inline-start">
                          <LockIcon className="text-muted-foreground" aria-hidden />
                        </InputGroupAddon>
                        <InputGroupInput
                          id="lib-preview-pass"
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                      </InputGroup>
                    </div>
                    <Button className="w-full gap-2 shadow-sm">
                      Continue
                      <SparklesIcon className="size-4 opacity-80" aria-hidden />
                    </Button>
                  </CardContent>
                </Card>

                <div className="grid gap-2">
                  <Label htmlFor="lib-preview-note">Release note</Label>
                  <Textarea
                    id="lib-preview-note"
                    placeholder="Ship summary, risk, rollback…"
                    className="min-h-30 resize-y"
                  />
                  <p className="text-xs text-muted-foreground">
                    Textarea inherits surface and ring tokens from the active theme.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-0">
            <TooltipProvider delayDuration={200}>
              <div className="space-y-8">
                <div>
                  <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Primary clusters
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <ButtonGroup className="shadow-sm">
                      <Button>Save draft</Button>
                      <Button variant="secondary" className="gap-1.5">
                        Review
                        <ChevronDownIcon className="size-4 opacity-70" aria-hidden />
                      </Button>
                    </ButtonGroup>
                    <ButtonGroup>
                      <Button variant="outline">Preview</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" aria-label="More publish options">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Environment</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Staging</DropdownMenuItem>
                          <DropdownMenuItem>Production</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Discard
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </ButtonGroup>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Variants
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Icon toolbar
                  </p>
                  <div className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-muted/25 p-1.5 shadow-inner">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-lg"
                        >
                          <CopyIcon className="size-4" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-lg"
                        >
                          <Share2Icon className="size-4" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Share</TooltipContent>
                    </Tooltip>
                    <Separator orientation="vertical" className="mx-0.5 h-6" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-lg"
                        >
                          <SendIcon className="size-4" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Send</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </TabsContent>

          <TabsContent value="feedback" className="mt-0 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="shadow-sm">Shipped</Badge>
              <Badge variant="secondary">Canary</Badge>
              <Badge variant="outline">Design</Badge>
              <Badge variant="destructive">Breaking</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-2xl border border-border/50 bg-card/80 p-4 ring-1 ring-border/25">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">Sync progress</span>
                  <span className="text-xs text-muted-foreground tabular-nums">72%</span>
                </div>
                <Progress value={72} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Track and muted foreground read cleanly in dark mode.
                </p>
              </div>
              <div className="space-y-3 rounded-2xl border border-border/50 bg-card/80 p-4 ring-1 ring-border/25">
                <p className="text-sm font-medium text-foreground">Loading shell</p>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-4/5 rounded-md" />
                  <Skeleton className="h-3 w-full rounded-md" />
                  <Skeleton className="h-3 w-3/5 rounded-md" />
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Alert className="border-emerald-500/25 bg-emerald-500/5 dark:border-emerald-400/20 dark:bg-emerald-500/10">
                <CheckCircle2Icon className="text-emerald-600 dark:text-emerald-400" aria-hidden />
                <AlertTitle>Checks passed</AlertTitle>
                <AlertDescription className="block text-pretty">
                  Theme tokens validated against the preset; no contrast regressions on{" "}
                  <code className="rounded bg-muted px-1 font-mono text-xs">muted-foreground</code>.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden />
                <AlertTitle>Action required</AlertTitle>
                <AlertDescription className="block text-pretty">
                  Destructive surfaces stay legible when the document class flips.
                </AlertDescription>
              </Alert>
            </div>

            <Alert>
              <InfoIcon className="size-4" aria-hidden />
              <AlertTitle>Neutral callout</AlertTitle>
              <AlertDescription className="block text-pretty">
                Default alerts use{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">card</code> and border
                tokens so they track appearance mode without extra wiring.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="surfaces" className="mt-0">
            <div className="grid gap-4 md:grid-cols-12 md:grid-rows-[auto_auto]">
              <Card
                className={cn(
                  "md:col-span-7 md:row-span-2",
                  "border-border/50 bg-linear-to-br from-primary/8 via-card to-card shadow-lg ring-1 ring-primary/20",
                  "dark:from-primary/15 dark:via-card dark:to-card dark:ring-primary/25",
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="secondary" className="mb-2 font-normal">
                        Featured
                      </Badge>
                      <CardTitle className="text-xl">Bento surface</CardTitle>
                      <CardDescription className="mt-1 max-w-md">
                        Gradient wash and ring use semantic tokens — swap mode and the panel should
                        stay balanced, not neon.
                      </CardDescription>
                    </div>
                    <BellIcon className="size-8 shrink-0 text-primary/70" aria-hidden />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator />
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                        24ms
                      </p>
                      <p className="text-xs text-muted-foreground">p95 hydration</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                        99.2%
                      </p>
                      <p className="text-xs text-muted-foreground">Contrast pass</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 md:col-span-5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Team</CardTitle>
                  <CardDescription>Avatar + list density</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Ava Chen", role: "Design systems", initials: "AC" },
                    { name: "Jordan Lee", role: "Frontend", initials: "JL" },
                    { name: "Sam Rivera", role: "Docs", initials: "SR" },
                  ].map((m) => (
                    <div
                      key={m.initials}
                      className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-border/60 hover:bg-muted/30"
                    >
                      <Avatar className="size-9 ring-2 ring-background">
                        <AvatarFallback className="bg-primary/15 text-xs font-medium text-primary">
                          {m.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-dashed border-border/70 bg-muted/10 md:col-span-5">
                <CardHeader>
                  <CardTitle className="text-base">Muted canvas</CardTitle>
                  <CardDescription>Secondary panel for settings or empty states</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Borders, dashed or solid, pick up{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs">border</code> and{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs">muted</code> so
                    previews stay honest in both themes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
