import { Button } from "@codefast/ui/button";
import { Input } from "@codefast/ui/input";
import { Label } from "@codefast/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";

export function TabsDemo() {
  return (
    <Tabs defaultValue="account" className="w-full max-w-sm">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-4 space-y-3">
        <div className="grid gap-1.5">
          <Label htmlFor="tabs-name">Name</Label>
          <Input id="tabs-name" defaultValue="Vuong Phan" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tabs-username">Username</Label>
          <Input id="tabs-username" defaultValue="@vuongphan" />
        </div>
        <Button size="sm">Save changes</Button>
      </TabsContent>

      <TabsContent value="password" className="mt-4 space-y-3">
        <div className="grid gap-1.5">
          <Label htmlFor="tabs-current">Current password</Label>
          <Input id="tabs-current" type="password" placeholder="••••••••" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tabs-new">New password</Label>
          <Input id="tabs-new" type="password" placeholder="Min. 8 characters" />
        </div>
        <Button size="sm">Update password</Button>
      </TabsContent>
    </Tabs>
  );
}
