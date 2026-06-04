import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import { BellIcon, ChartBarIcon, UserIcon } from "lucide-react";

export function TabsWithIcons() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-sm">
      <TabsList>
        <TabsTrigger value="overview">
          <ChartBarIcon />
          Overview
        </TabsTrigger>
        <TabsTrigger value="account">
          <UserIcon />
          Account
        </TabsTrigger>
        <TabsTrigger value="alerts">
          <BellIcon />
          Alerts
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-3 text-sm text-ui-muted">
        Key metrics at a glance.
      </TabsContent>
      <TabsContent value="account" className="mt-3 text-sm text-ui-muted">
        Your profile and preferences.
      </TabsContent>
      <TabsContent value="alerts" className="mt-3 text-sm text-ui-muted">
        Configure how you’re notified.
      </TabsContent>
    </Tabs>
  );
}
