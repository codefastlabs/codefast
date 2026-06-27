import { CopyIcon, DownloadIcon, FolderIcon, PencilIcon, Share2Icon, Trash2Icon } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { expect, fireEvent, screen } from "storybook/test";

import {
  ContextMenu,
  ContextMenuArrow,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "#/components/context-menu";

import preview from "../.storybook/preview";

/**
 * ContextMenu — a COMPOSITE overlay summoned by right-clicking a target region; the root
 * (`ContextMenu`) is a Radix provider whose only authorable prop here is `modal`. Content is
 * driven by `{...args}` through a small stateful demo wrapper (the checkbox item is controlled).
 * All content is authored for Storybook, NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { modal: true },
  argTypes: {
    dir: { table: { disable: true } },
    modal: { control: "boolean" },
    onOpenChange: { table: { disable: true } },
    open: { table: { disable: true } },
  },
  component: ContextMenu,
  parameters: {
    controls: { include: ["modal"] },
    docs: {
      description: {
        component: [
          "A menu summoned by right-clicking a target region, with the same items as a dropdown menu.",
          "",
          "**Anatomy:** `ContextMenu > ContextMenuTrigger + ContextMenuContent > (ContextMenuLabel · ContextMenuGroup · ContextMenuItem · ContextMenuCheckboxItem · ContextMenuRadioGroup > ContextMenuRadioItem · ContextMenuSub > (ContextMenuSubTrigger + ContextMenuSubContent) · ContextMenuSeparator)`.",
          "`ContextMenuTrigger` wraps the area that responds to right-click; `ContextMenuShortcut` renders a trailing key hint.",
        ].join("\n"),
      },
    },
  },
  subcomponents: {
    ContextMenuArrow,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
  },
  title: "Overlay/ContextMenu",
});

function ContextMenuDemo(props: ComponentProps<typeof ContextMenu>): React.JSX.Element {
  const [favorite, setFavorite] = useState(true);

  return (
    <ContextMenu {...props}>
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
  render: (args) => <ContextMenuDemo {...args} />,
});

/** Non-modal: surrounding page stays interactive while the menu is open. Reuses the base render. */
export const NonModal = meta.story({
  args: { modal: false },
  render: Default.input.render,
});

export const OpensOnRightClick = meta.story({
  render: Default.input.render,
});

/**
 * Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`.
 * Asserts the open contract: the menu is closed until a `contextmenu` event fires on the trigger,
 * then the portalled items appear.
 */
OpensOnRightClick.test("opens portalled items on right click", async ({ canvas }) => {
  await expect(screen.queryByText(/rename/i)).not.toBeInTheDocument();

  const trigger = canvas.getByText(/right-click to edit/i);

  await fireEvent.contextMenu(trigger);

  await expect(await screen.findByText(/rename/i)).toBeInTheDocument();
  await expect(await screen.findByText(/duplicate/i)).toBeInTheDocument();
});
