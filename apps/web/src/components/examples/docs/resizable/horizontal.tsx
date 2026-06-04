import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@codefast/ui/resizable";

export function ResizableHorizontal() {
  return (
    <ResizableGroup className="h-40 w-full max-w-md rounded-xl border">
      <ResizablePanel defaultSize={40} minSize={25}>
        <div className="flex h-full items-center justify-center p-4">
          <span className="text-sm text-ui-muted">Left</span>
        </div>
      </ResizablePanel>
      <ResizableSeparator />
      <ResizablePanel defaultSize={60} minSize={25}>
        <div className="flex h-full items-center justify-center p-4">
          <span className="text-sm text-ui-muted">Right</span>
        </div>
      </ResizablePanel>
    </ResizableGroup>
  );
}
