import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@codefast/ui/resizable";

export function ResizablePanels() {
  return (
    <ResizableGroup className="h-48 w-full max-w-md rounded-xl border">
      <ResizablePanel defaultSize={30} minSize={20}>
        <div className="flex h-full items-center justify-center p-4">
          <span className="text-sm text-ui-muted">Sidebar</span>
        </div>
      </ResizablePanel>
      <ResizableSeparator />
      <ResizablePanel defaultSize={70}>
        <ResizableGroup orientation="vertical">
          <ResizablePanel defaultSize={60}>
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-sm text-ui-muted">Content</span>
            </div>
          </ResizablePanel>
          <ResizableSeparator />
          <ResizablePanel defaultSize={40}>
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-sm text-ui-muted">Panel</span>
            </div>
          </ResizablePanel>
        </ResizableGroup>
      </ResizablePanel>
    </ResizableGroup>
  );
}
