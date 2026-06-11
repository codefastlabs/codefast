import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";

export function TabsDefault() {
  return (
    <Tabs defaultValue="account" className="w-full max-w-sm">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="mt-3 rounded-lg border border-ui-border p-4 text-sm text-ui-muted">
        Manage your account details and profile.
      </TabsContent>
      <TabsContent value="password" className="mt-3 rounded-lg border border-ui-border p-4 text-sm text-ui-muted">
        Change your password and security settings.
      </TabsContent>
      <TabsContent value="team" className="mt-3 rounded-lg border border-ui-border p-4 text-sm text-ui-muted">
        Invite teammates and manage roles.
      </TabsContent>
    </Tabs>
  );
}
