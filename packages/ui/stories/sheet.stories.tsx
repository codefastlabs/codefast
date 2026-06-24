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

const meta = preview.meta({
  component: Sheet,
  subcomponents: {
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetBody,
    SheetFooter,
    SheetClose,
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
  title: "Overlay/Sheet",
});

export const Default = meta.story({
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open sheet</Button>
      </SheetTrigger>
      <SheetContent>
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

const SHEET_SIDES = ["top", "right", "bottom", "left"] as const;

export const Side = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-2">
      {SHEET_SIDES.map((side) => (
        <Sheet key={side}>
          <SheetTrigger asChild>
            <Button variant="outline" className="capitalize">
              {side}
            </Button>
          </SheetTrigger>
          <SheetContent side={side} className="data-[side=bottom]:max-h-[50vh] data-[side=top]:max-h-[50vh]">
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>Make changes to your profile here. Click save when you&apos;re done.</SheetDescription>
            </SheetHeader>
            <div className="no-scrollbar overflow-y-auto px-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <p key={index} className="mb-2 leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
                  officia deserunt mollit anim id est laborum.
                </p>
              ))}
            </div>
            <SheetFooter>
              <Button type="submit">Save changes</Button>
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  ),
});

export const NoCloseButton = meta.story({
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>No Close Button</SheetTitle>
          <SheetDescription>
            This sheet doesn&apos;t have a close button in the top-right corner. Click outside to close.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
});

export const OpensOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
OpensOnClick.test("opens on click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /open sheet/i });

  await userEvent.click(trigger);

  await expect(await screen.findByText("Edit profile")).toBeInTheDocument();
  await expect(await screen.findByText(/update your profile details/i)).toBeInTheDocument();
});
