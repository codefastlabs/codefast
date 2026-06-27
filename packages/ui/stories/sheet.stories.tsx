import { expect, screen } from "storybook/test";

import { Button } from "#/components/button";
import { Input } from "#/components/input";
import { Label } from "#/components/label";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "#/components/sheet";

import preview from "../.storybook/preview";

/**
 * Sheet — a COMPOSITE overlay built on Radix Dialog. The root `Sheet` is a
 * context provider with NO DOM of its own, so binding `component` would make the
 * interesting props (`side`, `showCloseButton`, which live on `SheetContent`)
 * resolve to root props and break Controls. We use the FLAT-ARGS workaround: a
 * flat `SheetArgs` drives a single shared render, the real parts live in
 * `subcomponents` for docgen, and one composition is reused across states.
 *
 * Content here is authored for Storybook, NOT synced with the apps/web registry.
 */
interface SheetArgs {
  showCloseButton: boolean;
  side: "bottom" | "left" | "right" | "top";
}

const meta = preview.type<{ args: SheetArgs }>().meta({
  args: { showCloseButton: true, side: "right" },
  argTypes: {
    showCloseButton: { control: "boolean" },
    side: { control: "radio", options: ["top", "right", "bottom", "left"] },
  },
  parameters: {
    docs: {
      description: {
        component: [
          "A dialog that slides in from the side of the screen, typically for forms or secondary navigation.",
          "",
          "**Anatomy:** `Sheet > SheetTrigger + SheetContent > (SheetHeader (SheetTitle · SheetDescription) + SheetBody + SheetFooter (SheetClose))`.",
          "Set `side` (`top`/`right`/`bottom`/`left`) on `SheetContent` to choose which edge it anchors to.",
        ].join("\n"),
      },
    },
  },
  subcomponents: {
    SheetBody,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  },
  title: "Overlay/Sheet",
});

export const Default = meta.story({
  render: ({ showCloseButton, side }) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open sheet</Button>
      </SheetTrigger>
      <SheetContent
        className="data-[side=bottom]:max-h-[50vh] data-[side=top]:max-h-[50vh]"
        showCloseButton={showCloseButton}
        side={side}
      >
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>Update your profile details and save changes.</SheetDescription>
        </SheetHeader>
        <SheetBody className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="sheet-name">Name</Label>
            <Input id="sheet-name" defaultValue="Vuong Phan" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sheet-email">Email</Label>
            <Input id="sheet-email" defaultValue="mr.thevuong@gmail.com" type="email" />
          </div>
        </SheetBody>
        <SheetFooter>
          <SheetClose size="sm" variant="outline">
            Cancel
          </SheetClose>
          <SheetClose size="sm">Save changes</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
});

export const FromLeft = meta.story({
  args: { side: "left" },
  render: Default.input.render,
});

export const FromTop = meta.story({
  args: { side: "top" },
  render: Default.input.render,
});

export const NoCloseButton = meta.story({
  args: { showCloseButton: false },
  render: Default.input.render,
});

export const OpensOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
OpensOnClick.test("opens portalled content on trigger click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /open sheet/i });

  await userEvent.click(trigger);

  // Portalled content lives outside the canvas — query the document via screen.
  await expect(await screen.findByText("Edit profile")).toBeInTheDocument();
  await expect(await screen.findByText(/update your profile details/i)).toBeInTheDocument();
});
