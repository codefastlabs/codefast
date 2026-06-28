import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@codefast/ui/context-menu";
import { CopyIcon, DownloadIcon, FolderIcon, PencilIcon, Share2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";

export function ContextMenuDemo() {
  const [favorite, setFavorite] = useState(true);

  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex w-56 flex-col gap-3 rounded-xl border bg-ui-card p-3 select-none">
        <div className="aspect-video rounded-lg bg-gradient-to-br from-sky-400 to-violet-500" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ui-fg">cover-art.png</span>
          <span className="text-xs text-ui-muted">Right-click to edit</span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem>
          <PencilIcon />
          Rename
          <ContextMenuShortcut>⌘E</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <CopyIcon />
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <DownloadIcon />
          Download
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderIcon />
            Move to
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40">
            <ContextMenuItem>Projects</ContextMenuItem>
            <ContextMenuItem>Drafts</ContextMenuItem>
            <ContextMenuItem>Archive</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem
          checked={favorite}
          onCheckedChange={(value) => {
            setFavorite(value);
          }}
        >
          Add to favorites
        </ContextMenuCheckboxItem>
        <ContextMenuItem>
          <Share2Icon />
          Share…
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <Trash2Icon />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
