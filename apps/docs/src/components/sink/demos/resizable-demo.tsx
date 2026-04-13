import { cn } from "@codefast/tailwind-variants";
import { ResizableGroup, ResizablePanel, ResizableSeparator } from "@codefast/ui/resizable";

export function ResizableDemo() {
  return (
    <div className="flex w-full flex-col gap-6">
      <ResizableGroup
        orientation="horizontal"
        className={cn("max-w-md", "rounded-xl border", "md:min-w-112.5")}
      >
        <ResizablePanel defaultSize={50}>
          <div className={cn("flex h-50 items-center justify-center", "p-6")}>
            <span className="font-semibold">One</span>
          </div>
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={50}>
          <ResizableGroup orientation="vertical">
            <ResizablePanel defaultSize={25}>
              <div className={cn("flex h-full items-center justify-center", "p-6")}>
                <span className="font-semibold">Two</span>
              </div>
            </ResizablePanel>
            <ResizableSeparator />
            <ResizablePanel defaultSize={75}>
              <div className={cn("flex h-full items-center justify-center", "p-6")}>
                <span className="font-semibold">Three</span>
              </div>
            </ResizablePanel>
          </ResizableGroup>
        </ResizablePanel>
      </ResizableGroup>
      <ResizableGroup
        orientation="horizontal"
        className={cn("min-h-50 max-w-md", "rounded-xl border", "md:min-w-112.5")}
      >
        <ResizablePanel defaultSize={25}>
          <div className={cn("flex h-full items-center justify-center", "p-6")}>
            <span className="font-semibold">Sidebar</span>
          </div>
        </ResizablePanel>
        <ResizableSeparator withHandle />
        <ResizablePanel defaultSize={75}>
          <div className={cn("flex h-full items-center justify-center", "p-6")}>
            <span className="font-semibold">Content</span>
          </div>
        </ResizablePanel>
      </ResizableGroup>
      <ResizableGroup
        orientation="vertical"
        className={cn("min-h-50 max-w-md", "rounded-xl border", "md:min-w-112.5")}
      >
        <ResizablePanel defaultSize={25}>
          <div className={cn("flex h-full items-center justify-center", "p-6")}>
            <span className="font-semibold">Header</span>
          </div>
        </ResizablePanel>
        <ResizableSeparator />
        <ResizablePanel defaultSize={75}>
          <div className={cn("flex h-full items-center justify-center", "p-6")}>
            <span className="font-semibold">Content</span>
          </div>
        </ResizablePanel>
      </ResizableGroup>
    </div>
  );
}
