import { Avatar, AvatarFallback } from "@codefast/ui/avatar";
import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import { Progress } from "@codefast/ui/progress";
import { Separator } from "@codefast/ui/separator";
import { Switch } from "@codefast/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";

/** Interactive product card shown beside the home hero headline. */
export function HeroCard() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-ui-border/60 bg-ui-card shadow-2xl shadow-black/10 dark:shadow-black/40">
      <div className="flex items-center justify-between border-b border-ui-border/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">CF</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-ui-fg">Workspace settings</p>
            <p className="text-xs text-ui-muted">codefast/ui · Pro plan</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          Saved
        </Badge>
      </div>

      <Tabs defaultValue="notifications" className="p-5">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="general" className="flex-1 text-xs">
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 text-xs">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex-1 text-xs">
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-0 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="notify-email" className="text-xs text-ui-muted">
              Notify email
            </Label>
            <Input id="notify-email" type="email" defaultValue="you@company.com" />
          </div>

          <Separator />

          <div className="space-y-3">
            {[
              { label: "New deployments", defaultChecked: true },
              { label: "Security alerts", defaultChecked: true },
              { label: "Marketing emails", defaultChecked: false },
            ].map(({ label, defaultChecked }) => (
              <div key={label} className="flex items-center justify-between">
                <Label className="text-xs">{label}</Label>
                <Switch defaultChecked={defaultChecked} aria-label={label} className="scale-90" />
              </div>
            ))}
          </div>

          <Separator />

          <div>
            <div className="mb-1.5 flex justify-between text-xs text-ui-muted">
              <span>Storage</span>
              <span>6.8 GB / 10 GB</span>
            </div>
            <Progress value={68} aria-label="Storage used" className="h-1" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm">
              Discard
            </Button>
            <Button size="sm">Save changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="general" className="mt-0 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ws-name" className="text-xs text-ui-muted">
              Workspace name
            </Label>
            <Input id="ws-name" defaultValue="codefast/ui" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ws-url" className="text-xs text-ui-muted">
              Display URL
            </Label>
            <Input id="ws-url" defaultValue="codefast.dev" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="text-start">
              <p className="text-xs font-medium text-ui-fg">Public profile</p>
              <p className="text-xs text-ui-muted">Show workspace in directory</p>
            </div>
            <Switch defaultChecked aria-label="Public profile" className="scale-90" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm">
              Discard
            </Button>
            <Button size="sm">Save changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-0 space-y-4">
          <div className="rounded-lg border border-ui-border/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-ui-fg">Pro plan</p>
              <Badge className="text-xs">Active</Badge>
            </div>
            <p className="mb-2 text-xs text-ui-muted">Up to 10 seats · 10 GB storage</p>
            <p className="text-xs text-ui-muted">
              Next billing: <span className="text-ui-fg">Jun 1, 2026 · $49.00</span>
            </p>
          </div>
          <Separator />
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-ui-muted">
              <span>Seats used</span>
              <span>4 / 10</span>
            </div>
            <Progress value={40} aria-label="Seats used" className="h-1" />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm">
              Manage billing ›
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
