import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@codefast/ui/resizable";

export function ResizableVertical() {
  return (
    <ResizableGroup orientation="vertical" className="h-48 w-full max-w-md rounded-xl border">
      <ResizablePanel defaultSize={55} minSize={20}>
        <div className="flex h-full items-center justify-center p-4">
          <span className="text-sm text-ui-muted">Editor</span>
        </div>
      </ResizablePanel>
      <ResizableSeparator />
      <ResizablePanel defaultSize={45} minSize={20}>
        <div className="flex h-full items-center justify-center p-4">
          <span className="text-sm text-ui-muted">Terminal</span>
        </div>
      </ResizablePanel>
    </ResizableGroup>
  );
}
