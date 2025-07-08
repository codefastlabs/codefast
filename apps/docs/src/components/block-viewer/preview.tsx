import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@codefast/ui";

import { useBlockViewer } from "@/components/block-viewer/provider";

import type { JSX } from "react";

export function BlockViewerPreview(): JSX.Element {
  const { item, resizablePanelRef } = useBlockViewer("BlockViewerPreview");

  return (
    <div className="md:h-(--height) group-data-[view=code]/block-view-wrapper:hidden">
      <div className="grid w-full gap-4">
        <ResizablePanelGroup className="relative z-10" direction="horizontal">
          <ResizablePanel
            ref={resizablePanelRef}
            className="bg-background relative aspect-[4/2.5] rounded-xl border md:aspect-auto"
            defaultSize={100}
            minSize={30}
          >
            <iframe
              className="bg-background h-(--height) relative z-20 hidden w-full md:block"
              src={`/view/${item.slug}`}
              title={item.title}
            />
          </ResizablePanel>
          <ResizableHandle className="after:bg-border relative hidden w-3 bg-transparent p-0 after:absolute after:right-0 after:top-1/2 after:h-8 after:w-1.5 after:-translate-x-px after:-translate-y-1/2 after:rounded-full after:transition-all hover:after:h-10 data-[resize-handle-state=drag]:after:h-10 md:block" />
          <ResizablePanel defaultSize={0} minSize={0} />
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
