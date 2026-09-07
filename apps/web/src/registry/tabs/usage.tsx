import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";

export function TabsUsage() {
  return (
    <Tabs className="w-full max-w-xs" defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Make changes to your account here.</TabsContent>
      <TabsContent value="password">Change your password here.</TabsContent>
    </Tabs>
  );
}
