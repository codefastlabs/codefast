import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@codefast/ui/card";
import { Kbd, KbdGroup } from "@codefast/ui/kbd";
import { Label } from "@codefast/ui/label";
import { Slider } from "@codefast/ui/slider";
import { Switch } from "@codefast/ui/switch";

/**
 * Floating collage of real `@codefast/ui` components beside the hero headline — the product,
 * staged rather than screenshotted. Entrance and float animations live on separate wrappers,
 * since an element can run only one animation at a time.
 */
export function UiHeroShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-xs lg:mx-0">
      <div className="hero-enter [--hero-enter-delay:200ms]">
        <Card className="shadow-2xl shadow-black/10 dark:shadow-black/40">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Tune the interface to your taste.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="hero-appearance">Dark appearance</Label>
              <Switch id="hero-appearance" defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="hero-motion">Reduce motion</Label>
              <Switch id="hero-motion" />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm font-medium text-ui-fg">
                <span>Accent strength</span>
                <span className="text-ui-muted tabular-nums">60%</span>
              </div>
              <Slider aria-label="Accent strength" defaultValue={[60]} max={100} step={1} />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Save changes</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="hero-enter absolute -end-6 -top-8 z-10 hidden [--hero-enter-delay:420ms] sm:block">
        <div className="hero-float [--hero-float-delay:1.4s]">
          <div className="flex items-center gap-2.5 rounded-2xl border border-ui-border/60 bg-ui-card px-3.5 py-2.5 shadow-xl shadow-black/10 dark:shadow-black/40">
            <span className="text-sm text-ui-muted">Search</span>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </div>
        </div>
      </div>

      <div className="hero-enter absolute -start-8 -bottom-8 z-10 hidden [--hero-enter-delay:600ms] sm:block">
        <div className="hero-float">
          <div className="flex items-center gap-2 rounded-2xl border border-ui-border/60 bg-ui-card px-3.5 py-3 shadow-xl shadow-black/10 dark:shadow-black/40">
            <Badge>Stable</Badge>
            <Badge variant="secondary">Typed</Badge>
            <Badge variant="outline">a11y</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
