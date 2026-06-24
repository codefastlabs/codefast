import { useState } from "react";
import { expect, screen } from "storybook/test";

import {
  Menubar,
  MenubarArrow,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "#/components/menubar";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: Menubar,
  subcomponents: {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarLabel,
    MenubarGroup,
    MenubarItem,
    MenubarCheckboxItem,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
    MenubarSeparator,
    MenubarShortcut,
    MenubarArrow,
  },
  parameters: {
    docs: {
      description: {
        component: [
          "A horizontal bar of top-level menus, like the menu bar of a desktop application.",
          "",
          "**Anatomy:** `Menubar > MenubarMenu > (MenubarTrigger + MenubarContent > (MenubarLabel · MenubarGroup · MenubarItem · MenubarCheckboxItem · MenubarRadioGroup > MenubarRadioItem · MenubarSub > (MenubarSubTrigger + MenubarSubContent) · MenubarSeparator))`.",
          "Each top-level menu is one `MenubarMenu`; `MenubarShortcut` renders a trailing key hint inside an item.",
        ].join("\n"),
      },
    },
  },
  title: "Navigation/Menubar",
});

function MenubarExample() {
  const [showToolbar, setShowToolbar] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState("100");

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New File <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Open… <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Share</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Copy link</MenubarItem>
              <MenubarItem>Email link</MenubarItem>
              <MenubarItem>Embed</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>
            Print… <MenubarShortcut>⌘P</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Cut <MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Copy <MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Paste <MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem
            checked={showToolbar}
            onCheckedChange={(value) => {
              setShowToolbar(value);
            }}
          >
            Show toolbar
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            checked={showGrid}
            onCheckedChange={(value) => {
              setShowGrid(value);
            }}
          >
            Show grid
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarGroup>
            <MenubarLabel>Zoom</MenubarLabel>
            <MenubarRadioGroup value={zoom} onValueChange={setZoom}>
              <MenubarRadioItem value="50">50%</MenubarRadioItem>
              <MenubarRadioItem value="100">100%</MenubarRadioItem>
              <MenubarRadioItem value="150">150%</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

export const Default = meta.story({
  render: () => <MenubarExample />,
});

export const OpensOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
OpensOnClick.test("opens on click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("menuitem", { name: "File" });

  await userEvent.click(trigger);

  await expect(await screen.findByRole("menuitem", { name: /new file/i })).toBeVisible();
});
