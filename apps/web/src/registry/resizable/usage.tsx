import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@codefast/ui/resizable";

export function ResizableUsage() {
  return (
    <ResizableGroup className="max-w-md rounded-lg border">
      <ResizablePanel defaultSize={50}>
        <div className="flex h-32 items-center justify-center p-6">One</div>
      </ResizablePanel>
      <ResizableSeparator />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-32 items-center justify-center p-6">Two</div>
      </ResizablePanel>
    </ResizableGroup>
  );
}
