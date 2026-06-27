import { useState } from "react";
import { expect, screen } from "storybook/test";

import { Button } from "#/components/button";
import {
  DropdownMenu,
  DropdownMenuArrow,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "#/components/dropdown-menu";

import preview from "../.storybook/preview";

/**
 * DropdownMenu — a COMPOSITE overlay. The root (`DropdownMenu`) is a Radix Root that owns the
 * open-state contract (`defaultOpen`, `modal`, `dir`) and drives the portalled `DropdownMenuContent`.
 * Controls bind to the root; child parts only render inside it, so they are documented via
 * `subcomponents`. All content here is authored against the component's own public API for
 * Storybook — it is NOT synced with or copied from the apps/web registry.
 */
const meta = preview.meta({
  args: { defaultOpen: false, dir: "ltr", modal: true },
  argTypes: {
    defaultOpen: { control: "boolean" },
    dir: { control: "radio", options: ["ltr", "rtl"] },
    modal: { control: "boolean" },
    onOpenChange: { table: { disable: true } },
    open: { table: { disable: true } },
  },
  component: DropdownMenu,
  parameters: {
    controls: { include: ["defaultOpen", "modal", "dir"] },
    docs: {
      description: {
        component: [
          "A menu of actions triggered by a button, with support for checkboxes, radios, and nested submenus.",
          "",
          "**Anatomy:** `DropdownMenu > DropdownMenuTrigger + DropdownMenuContent > (DropdownMenuLabel · DropdownMenuGroup · DropdownMenuItem · DropdownMenuCheckboxItem · DropdownMenuRadioGroup > DropdownMenuRadioItem · DropdownMenuSub > (DropdownMenuSubTrigger + DropdownMenuSubContent) · DropdownMenuSeparator)`.",
          "`DropdownMenuShortcut` renders a trailing key hint inside an item.",
        ].join("\n"),
      },
    },
  },
  subcomponents: {
    DropdownMenuArrow,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
  },
  title: "Overlay/DropdownMenu",
});

export const Default = meta.story({
  render: (args) => (
    <DropdownMenu {...args}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Profile<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Settings<DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          Log out<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
});

/**
 * Opens with the menu already expanded — same composition as `Default`, differs only by `args`,
 * so it reuses `Default.input.render`.
 */
export const Open = meta.story({
  args: { defaultOpen: true },
  render: Default.input.render,
});

/**
 * A genuinely different composition: stateful checkbox items. Keeps its own render but still
 * forwards `args` to the root so the open/modal/dir controls stay live.
 */
export const Checkboxes = meta.story({
  render: (args) => {
    function CheckboxesExample(): React.JSX.Element {
      const [showStatusBar, setShowStatusBar] = useState(true);
      const [showActivityBar, setShowActivityBar] = useState(false);
      const [showPanel, setShowPanel] = useState(false);

      return (
        <DropdownMenu {...args}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={showStatusBar} onCheckedChange={setShowStatusBar}>
                Status Bar
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={showActivityBar} disabled onCheckedChange={setShowActivityBar}>
                Activity Bar
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={showPanel} onCheckedChange={setShowPanel}>
                Panel
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return <CheckboxesExample />;
  },
});

/**
 * A genuinely different composition: a single-select radio group. Own render, args forwarded.
 */
export const RadioGroup = meta.story({
  render: (args) => {
    function RadioGroupExample(): React.JSX.Element {
      const [position, setPosition] = useState("bottom");

      return (
        <DropdownMenu {...args}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-32">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return <RadioGroupExample />;
  },
});

export const OpensOnClick = meta.story({
  render: Default.input.render,
});

/**
 * Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. Asserts the
 * open-state contract: the trigger reports collapsed, then expanded, and portalled items appear.
 */
OpensOnClick.test("expands the menu and reveals items on click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /open menu/i });

  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await userEvent.click(trigger);

  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(await screen.findByText(/my account/i)).toBeInTheDocument();
  await expect(await screen.findByText(/billing/i)).toBeInTheDocument();
});
