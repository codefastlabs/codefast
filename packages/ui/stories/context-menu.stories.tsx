import { CopyIcon, DownloadIcon, FolderIcon, PencilIcon, Share2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { expect, fireEvent, screen } from "storybook/test";

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "#/components/context-menu";

import preview from "../.storybook/preview";

const meta = preview.meta({ title: "Overlay/ContextMenu" });

function ContextMenuDemo() {
  const [favorite, setFavorite] = useState(true);

  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex w-56 flex-col gap-3 rounded-xl border bg-card p-3 select-none">
        <div className="aspect-video rounded-lg bg-gradient-to-br from-sky-400 to-violet-500" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">cover-art.png</span>
          <span className="text-xs text-muted-foreground">Right-click to edit</span>
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

export const Default = meta.story({
  render: () => <ContextMenuDemo />,
});

export const Basic = meta.story({
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-32 w-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground select-none">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuLabel>Actions</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem>Back</ContextMenuItem>
        <ContextMenuItem>Forward</ContextMenuItem>
        <ContextMenuItem>Reload</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
});

export const OpensOnRightClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
OpensOnRightClick.test("opens on right click", async ({ canvas }) => {
  const trigger = canvas.getByText(/right-click to edit/i);

  await fireEvent.contextMenu(trigger);

  await expect(await screen.findByText(/rename/i)).toBeInTheDocument();
  await expect(await screen.findByText(/duplicate/i)).toBeInTheDocument();
});
