import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui/card";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import { Switch } from "@codefast/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import { createFileRoute } from "@tanstack/react-router";

import { DemoSection } from "#/components/demo-section";

export const Route = createFileRoute("/ui")({
  component: UiPage,
});

function UiPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">@codefast/ui</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Components imported from the published package via per-component subpaths such as{" "}
          <code className="font-mono">@codefast/ui/button</code>. Use the appearance toggle in the header — every
          surface here is driven by <code className="font-mono">@codefast/theme</code>.
        </p>
      </header>

      <DemoSection
        description="The full variant set, rendered straight from the shipped buttonVariants."
        title="Button variants"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </DemoSection>

      <DemoSection title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </DemoSection>

      <DemoSection description="Card primitives plus a form field, a switch, and tabs." title="Composition">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter</CardTitle>
              <CardDescription>Card, Input, Label and Switch working together.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="you@example.com" type="email" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly">Weekly digest</Label>
                <Switch defaultChecked id="weekly" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Subscribe</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabs</CardTitle>
              <CardDescription>Radix-backed, keyboard accessible.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="install">Install</TabsTrigger>
                </TabsList>
                <TabsContent className="pt-3 text-sm text-muted-foreground" value="overview">
                  Each tab panel is an accessible region with managed focus and roving tabindex.
                </TabsContent>
                <TabsContent className="pt-3 text-sm" value="install">
                  <code className="font-mono">pnpm add @codefast/ui</code>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DemoSection>
    </div>
  );
}
