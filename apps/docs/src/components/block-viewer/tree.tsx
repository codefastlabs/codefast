import type { CSSProperties, JSX } from "react";

import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";

import type { FileTree } from "@/lib/registry";

import { useBlockViewer } from "@/components/block-viewer/provider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@codefast/ui";

interface TreeProps {
  index: number;
  item: FileTree;
}

export function BlockViewerTree({ index, item }: TreeProps): JSX.Element {
  const { activeFile, setActiveFile } = useBlockViewer("Tree");

  if (!item.children) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          className="pl-(--index) whitespace-nowrap rounded-none hover:bg-zinc-700 hover:text-white focus:bg-zinc-700 focus:text-white focus-visible:bg-zinc-700 focus-visible:text-white active:bg-zinc-700 active:text-white data-[active=true]:bg-zinc-700 data-[active=true]:text-white"
          data-index={index}
          isActive={item.path === activeFile}
          style={
            {
              "--index": `${index.toString()}rem`,
            } as CSSProperties
          }
          onClick={() => {
            if (item.path) {
              setActiveFile(item.path);
            }
          }}
        >
          <ChevronRightIcon className="invisible" />
          <FileIcon className="size-4" />
          {item.name}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        defaultOpen
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className="pl-(--index) whitespace-nowrap rounded-none hover:bg-zinc-700 hover:text-white focus-visible:bg-zinc-700 focus-visible:text-white active:bg-zinc-700 active:text-white data-[active=true]:bg-zinc-700 data-[active=true]:text-white data-[state=open]:hover:bg-zinc-700 data-[state=open]:hover:text-white"
            style={
              {
                "--index": `${index.toString()}rem`,
              } as CSSProperties
            }
          >
            <ChevronRightIcon className="size-4 transition-transform" />
            <FolderIcon className="size-4" />
            {item.name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="m-0 w-full border-none p-0">
            {item.children.map((subItem) => (
              <BlockViewerTree key={subItem.name} index={index + 1} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
