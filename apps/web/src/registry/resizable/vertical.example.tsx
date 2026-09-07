import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@codefast/ui/resizable";

export function ResizableVertical() {
  return (
    <ResizableGroup orientation="vertical" className="min-h-50 max-w-sm rounded-lg border">
      <ResizablePanel defaultSize="25%">
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Header</span>
        </div>
      </ResizablePanel>
      <ResizableSeparator />
      <ResizablePanel defaultSize="75%">
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Content</span>
        </div>
      </ResizablePanel>
    </ResizableGroup>
  );
}
