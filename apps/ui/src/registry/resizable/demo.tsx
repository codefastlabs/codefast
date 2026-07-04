import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@codefast/ui/resizable";

export function ResizableDemo() {
  return (
    <ResizableGroup className="w-full max-w-sm rounded-lg border" orientation="horizontal">
      <ResizablePanel defaultSize={50}>
        <div className="flex h-[200px] items-center justify-center p-6">
          <span className="font-semibold text-ui-fg">One</span>
        </div>
      </ResizablePanel>
      <ResizableSeparator withHandle />
      <ResizablePanel defaultSize={50}>
        <ResizableGroup orientation="vertical">
          <ResizablePanel defaultSize={25}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold text-ui-fg">Two</span>
            </div>
          </ResizablePanel>
          <ResizableSeparator withHandle />
          <ResizablePanel defaultSize={75}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold text-ui-fg">Three</span>
            </div>
          </ResizablePanel>
        </ResizableGroup>
      </ResizablePanel>
    </ResizableGroup>
  );
}
