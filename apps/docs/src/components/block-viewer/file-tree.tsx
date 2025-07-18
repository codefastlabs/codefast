import type { ReactNode } from "react";

import { useBlockViewer } from "@/components/block-viewer/provider";
import { BlockViewerTree } from "@/components/block-viewer/tree";
import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarProvider,
} from "@codefast/ui";

export function BlockViewerFileTree(): ReactNode {
  const { tree } = useBlockViewer("BlockViewerFileTree");

  if (!tree) {
    return null;
  }

  return (
    <SidebarProvider className="flex !min-h-full flex-col">
      <Sidebar
        className="w-full flex-1 border-r border-zinc-700 bg-zinc-900 text-white"
        collapsible="none"
      >
        <SidebarGroupLabel className="h-12 rounded-none border-b border-zinc-700 px-4 text-sm text-white">
          Files
        </SidebarGroupLabel>
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {tree.map((file) => (
                <BlockViewerTree key={file.name} index={1} item={file} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </Sidebar>
    </SidebarProvider>
  );
}
