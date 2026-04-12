import { cn } from "@codefast/tailwind-variants";
import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Checkbox } from "@codefast/ui/checkbox";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import { Progress } from "@codefast/ui/progress";
import { Switch } from "@codefast/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import { Link } from "@tanstack/react-router";
import {
  AccessibilityIcon,
  ArrowRightIcon,
  CodeIcon,
  LayersIcon,
  PaletteIcon,
  RocketIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { useEffect, useId, useState } from "react";

function LivePlaygroundCard() {
  const baseId = useId();
  const nameId = `${baseId}-name`;
  const roleId = `${baseId}-role`;
  const switchId = `${baseId}-switch`;
  const checkboxId = `${baseId}-checkbox`;

  return (
    <Card
      className={cn(
        "flex h-full min-h-[min(22rem,70dvh)] flex-col",
        "border-border/80 bg-card/90 shadow-md ring-1 ring-border/40",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Live playground</CardTitle>
            <CardDescription>
              Tabs, inputs, switches, and actions from{" "}
              <code className={cn("px-1", "rounded bg-muted", "font-mono text-xs")}>
                @codefast/ui
              </code>
              .
            </CardDescription>
          </div>
          <Badge variant="secondary" className={cn("shrink-0", "font-normal")}>
            Interactive
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className={cn("space-y-4", "mt-4")}>
            <div className="grid gap-2">
              <Label htmlFor={nameId}>Display name</Label>
              <Input id={nameId} placeholder="Ada Lovelace" defaultValue="Ada Lovelace" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={roleId}>Role</Label>
              <Input id={roleId} placeholder="Engineer" defaultValue="Design systems" />
            </div>
          </TabsContent>
          <TabsContent value="workspace" className={cn("space-y-4", "mt-4")}>
            <div
              className={cn(
                "flex items-center justify-between gap-4",
                "px-3 py-2.5",
                "rounded-lg border border-border/80 bg-muted/30",
              )}
            >
              <div className="space-y-0.5">
                <Label htmlFor={switchId} className="text-sm font-medium">
                  Public workspace
                </Label>
                <p className="text-xs text-muted-foreground">Let teammates view boards.</p>
              </div>
              <Switch id={switchId} defaultChecked />
            </div>
            <div
              className={cn(
                "flex items-start gap-3",
                "px-3 py-3",
                "rounded-lg border border-border/80 bg-muted/20",
              )}
            >
              <Checkbox id={checkboxId} defaultChecked className="mt-0.5" />
              <div className={cn("grid gap-0.5", "leading-none")}>
                <Label htmlFor={checkboxId} className="text-sm leading-snug font-medium">
                  Sync edits to cloud
                </Label>
                <p className="text-xs leading-snug text-muted-foreground">
                  Uses the same checkbox primitive as your forms.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Button variants</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">
              Secondary
            </Button>
            <Button size="sm" variant="outline">
              Outline
            </Button>
            <Button size="sm" variant="ghost">
              Ghost
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressDemoCard() {
  const [progress, setProgress] = useState(8);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const steps = [24, 48, 72, 100];
    let i = 0;
    const id = window.setInterval(() => {
      const next = steps[i];
      if (next !== undefined) {
        setProgress(next);
        i += 1;
      } else {
        window.clearInterval(id);
      }
    }, 420);
    return () => window.clearInterval(id);
  }, [key]);

  const replay = () => {
    setProgress(8);
    setKey((k) => k + 1);
  };

  return (
    <Card className={cn("h-full", "border-border/80 bg-card/80 shadow-sm ring-1 ring-border/30")}>
      <CardHeader className="pb-2">
        <div className={cn("flex size-9 items-center justify-center", "rounded-lg bg-primary/10")}>
          <ZapIcon className={cn("size-4", "text-primary")} aria-hidden />
        </div>
        <CardTitle className="text-base">Feedback states</CardTitle>
        <CardDescription>
          Progress and loading patterns use shared tokens so they match light and dark surfaces.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-xs text-muted-foreground", "tabular-nums")}>{progress}%</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-8", "text-xs")}
            onClick={replay}
          >
            Replay
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function HomeBentoShowcase() {
  return (
    <div
      className={cn(
        "grid max-w-[1400px] gap-4",
        "mx-auto",
        "md:grid-cols-12 md:grid-rows-[auto_auto]",
      )}
    >
      <div className={cn("md:col-span-12 md:row-span-2", "lg:col-span-7")}>
        <LivePlaygroundCard />
      </div>

      <div className={cn("md:col-span-12", "lg:col-span-5")}>
        <Card
          className={cn(
            "h-full",
            "border-border/80 bg-linear-to-br from-primary/8 via-card to-card shadow-sm ring-1 ring-primary/10",
          )}
        >
          <CardHeader className="pb-2">
            <div
              className={cn("flex size-9 items-center justify-center", "rounded-lg bg-primary/12")}
            >
              <RocketIcon className={cn("size-4", "text-primary")} aria-hidden />
            </div>
            <CardTitle className="text-base">Ship consistent UI faster</CardTitle>
            <CardDescription className="text-pretty">
              Compound components and typed variants reduce one-off styles. Reach for the same
              primitives for dashboards and marketing pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="secondary" size="sm" className="gap-1.5">
              <Link to="/sink">
                Browse all modules
                <ArrowRightIcon className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className={cn("md:col-span-12", "lg:col-span-5")}>
        <Card
          className={cn("h-full", "border-border/80 bg-card/80 shadow-sm ring-1 ring-border/30")}
        >
          <CardHeader className="pb-2">
            <div
              className={cn(
                "flex size-9 items-center justify-center",
                "rounded-lg bg-violet-500/12",
              )}
            >
              <PaletteIcon
                className={cn("size-4", "text-violet-700", "dark:text-violet-300")}
                aria-hidden
              />
            </div>
            <CardTitle className="text-base">Theme-ready tokens</CardTitle>
            <CardDescription className="text-pretty">
              Switch appearance modes on the theme page. Swap accent palettes by importing a
              different CSS file—no component rewrites.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/theme">
                Open appearance
                <ArrowRightIcon className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className={cn("md:col-span-6", "lg:col-span-4")}>
        <ProgressDemoCard />
      </div>

      <div className={cn("md:col-span-6", "lg:col-span-4")}>
        <Card
          className={cn("h-full", "border-border/80 bg-card/80 shadow-sm ring-1 ring-border/30")}
        >
          <CardHeader className="pb-2">
            <div
              className={cn(
                "flex size-9 items-center justify-center",
                "rounded-lg bg-emerald-500/12",
              )}
            >
              <AccessibilityIcon
                className={cn("size-4", "text-emerald-700", "dark:text-emerald-400")}
                aria-hidden
              />
            </div>
            <CardTitle className="text-base">Accessible by default</CardTitle>
            <CardDescription className="text-pretty">
              Built on Radix primitives with keyboard support and sensible ARIA—less rework before
              you ship.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className={cn("md:col-span-12", "lg:col-span-4")}>
        <Card
          className={cn("h-full", "border-border/80 bg-muted/25 shadow-sm ring-1 ring-border/40")}
        >
          <CardHeader className="pb-2">
            <div
              className={cn(
                "flex size-9 items-center justify-center",
                "rounded-lg bg-foreground/8",
              )}
            >
              <LayersIcon className={cn("size-4", "text-foreground")} aria-hidden />
            </div>
            <CardTitle className="text-base">Tree-shakeable imports</CardTitle>
            <CardDescription className="text-pretty">
              Import only what you render. Each module is a separate entry point.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              className={cn(
                "px-3 py-2.5",
                "rounded-lg border border-border/80 bg-background/80",
                "font-mono text-[0.7rem] leading-relaxed text-foreground",
                "sm:text-xs",
              )}
            >
              <span className={cn("text-blue-700", "dark:text-blue-400")}>import</span>
              {" { Button } "}
              <span className={cn("text-blue-700", "dark:text-blue-400")}>from</span>
              <br />
              <span className={cn("text-green-800", "dark:text-green-400")}>
                &apos;@codefast/ui/button&apos;
              </span>
            </div>
            <div className={cn("flex flex-wrap gap-2", "mt-3")}>
              <Badge variant="outline" className={cn("gap-1", "font-normal")}>
                <CodeIcon className="size-3" aria-hidden />
                TypeScript
              </Badge>
              <Badge variant="outline" className={cn("gap-1", "font-normal")}>
                <SparklesIcon className="size-3" aria-hidden />
                Tailwind v4
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
