import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui/card";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import { Switch } from "@codefast/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";

import { DemoSection } from "#/components/demo-section";

export function CompositionSection() {
  return (
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
  );
}
