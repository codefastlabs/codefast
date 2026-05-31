import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";

export function TabsDemo() {
  return (
    <Tabs defaultValue="preview" className="w-full max-w-sm">
      <TabsList>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
        <TabsTrigger value="docs">Docs</TabsTrigger>
      </TabsList>
      <TabsContent
        value="preview"
        className="mt-3 rounded-lg border border-ui-border p-4 text-sm text-ui-muted"
      >
        Live component preview renders here.
      </TabsContent>
      <TabsContent value="code" className="mt-3 overflow-hidden rounded-lg">
        <pre className="bg-neutral-900 p-4 font-mono text-xs text-neutral-100">
          <code>{`<Button variant="outline">Click me</Button>`}</code>
        </pre>
      </TabsContent>
      <TabsContent
        value="docs"
        className="mt-3 rounded-lg border border-ui-border p-4 text-sm text-ui-muted"
      >
        Full API reference and usage examples.
      </TabsContent>
    </Tabs>
  );
}
