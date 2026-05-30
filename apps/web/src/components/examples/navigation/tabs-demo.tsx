import { cn } from "@codefast/tailwind-variants";
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
        className={cn(
          "mt-3 p-4",
          "rounded-lg border border-border",
          "text-sm text-muted-foreground",
        )}
      >
        Live component preview renders here.
      </TabsContent>
      <TabsContent value="code" className={cn("mt-3 overflow-hidden", "rounded-lg")}>
        <pre className={cn("p-4", "bg-neutral-900 font-mono text-xs text-neutral-100")}>
          <code>{`<Button variant="outline">Click me</Button>`}</code>
        </pre>
      </TabsContent>
      <TabsContent
        value="docs"
        className={cn(
          "mt-3 p-4",
          "rounded-lg border border-border",
          "text-sm text-muted-foreground",
        )}
      >
        Full API reference and usage examples.
      </TabsContent>
    </Tabs>
  );
}
