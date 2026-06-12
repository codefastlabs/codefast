import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";

export function TabsLine() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-sm">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-3 text-sm text-ui-muted">
        A high-level summary of your workspace.
      </TabsContent>
      <TabsContent value="activity" className="mt-3 text-sm text-ui-muted">
        Recent events and notifications.
      </TabsContent>
      <TabsContent value="settings" className="mt-3 text-sm text-ui-muted">
        Workspace preferences and integrations.
      </TabsContent>
    </Tabs>
  );
}
