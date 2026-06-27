import type { ComponentProps, JSX } from "react";
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

/**
 * Menubar — a COMPOSITE desktop-style menu bar. The root (`Menubar`) is a normal
 * component whose props (`loop`, `dir`) drive keyboard/RTL behavior, so `component`
 * is bound and `{...args}` flows into the root. All content below is authored for
 * Storybook to exercise the full surface (items, shortcuts, submenu, checkbox,
 * radio) — it is NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { dir: "ltr", loop: false },
  argTypes: {
    defaultValue: { table: { disable: true } },
    dir: { control: "radio", options: ["ltr", "rtl"] },
    loop: { control: "boolean" },
    onValueChange: { table: { disable: true } },
    value: { table: { disable: true } },
  },
  component: Menubar,
  parameters: {
    controls: { include: ["loop", "dir"] },
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
  subcomponents: {
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
  },
  title: "Navigation/Menubar",
});

function MenubarExample(props: ComponentProps<typeof Menubar>): JSX.Element {
  const [showToolbar, setShowToolbar] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState("100");

  return (
    <Menubar {...props}>
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
  render: (args) => <MenubarExample {...args} />,
});

export const OpensOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
OpensOnClick.test("opens the File menu on click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("menuitem", { name: "File" });

  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await userEvent.click(trigger);

  // Content is portalled; assert presence (not visibility) by text with a
  // generous timeout to ride out Radix's entrance animation.
  await expect(await screen.findByText(/new file/i, {}, { timeout: 3000 })).toBeInTheDocument();

  // Contract: opening the menu flips the trigger's aria-expanded.
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
});
