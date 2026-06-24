import { expect, screen } from "storybook/test";

import { Button } from "#/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "#/components/drawer";
import { Input } from "#/components/input";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { direction: "bottom", modal: true, shouldScaleBackground: true },
  argTypes: {
    onOpenChange: { table: { disable: true } },
    open: { table: { disable: true } },
  },
  component: Drawer,
  subcomponents: {
    DrawerTrigger,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
  },
  parameters: {
    docs: {
      description: {
        component: [
          "A panel that slides in from an edge of the screen, built on Vaul with drag-to-dismiss.",
          "",
          "**Anatomy:** `Drawer > DrawerTrigger + DrawerContent > (DrawerHeader (DrawerTitle · DrawerDescription) + DrawerFooter (DrawerClose))`.",
          "Set `direction` (`top`/`right`/`bottom`/`left`) on the root to choose the edge it slides from.",
        ].join("\n"),
      },
    },
  },
  title: "Overlay/Drawer",
});

export const Default = meta.story({
  render: (args) => (
    <Drawer {...args}>
      <DrawerTrigger asChild>
        <Button variant="outline">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit profile</DrawerTitle>
          <DrawerDescription>Make changes and save when done.</DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-3 overflow-auto px-4">
          <div className="grid gap-1.5">
            <Label htmlFor="drawer-name">Name</Label>
            <Input id="drawer-name" defaultValue="Vuong Phan" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="drawer-username">Username</Label>
            <Input id="drawer-username" defaultValue="@vuongphan" />
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose size="sm" variant="outline">
            Cancel
          </DrawerClose>
          <DrawerClose size="sm">Save changes</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
});

const DRAWER_SIDES = ["top", "right", "bottom", "left"] as const;

export const Sides = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-2">
      {DRAWER_SIDES.map((side) => (
        <Drawer key={side} direction={side}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="capitalize">
              {side}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[50vh] data-[vaul-drawer-direction=top]:max-h-[50vh]">
            <DrawerHeader>
              <DrawerTitle>Move Goal</DrawerTitle>
              <DrawerDescription>Set your daily activity goal.</DrawerDescription>
            </DrawerHeader>
            <div className="no-scrollbar overflow-y-auto px-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <p key={index} className="mb-4 leading-normal">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat.
                </p>
              ))}
            </div>
            <DrawerFooter>
              <Button>Submit</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  ),
});

export const ScrollableContent = meta.story({
  render: () => (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline">Scrollable Content</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Move Goal</DrawerTitle>
          <DrawerDescription>Set your daily activity goal.</DrawerDescription>
        </DrawerHeader>
        <div className="no-scrollbar overflow-y-auto px-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <p key={index} className="mb-4 leading-normal">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat.
            </p>
          ))}
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
});

export const OpensOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
OpensOnClick.test("opens on click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /open drawer/i });
  await userEvent.click(trigger);
  await expect(await screen.findByRole("dialog")).toBeVisible();
  await expect(await screen.findByText(/make changes and save when done/i)).toBeVisible();
});
