import { expect, fn, screen, waitFor } from "storybook/test";

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

/**
 * Drawer — a COMPOSITE overlay built on Vaul whose root (`Drawer`) is a context provider
 * with no DOM of its own and whose props form a controlled/uncontrolled union, so binding
 * `component` + a typed `render` would collapse args to `never`. We use the flat-args
 * workaround: a flat `DrawerArgs` interface drives explicit Controls, while the real parts
 * stay in `subcomponents` for docgen. Content is authored for Storybook, NOT synced with
 * the apps/web registry.
 */
interface DrawerArgs {
  direction: "bottom" | "left" | "right" | "top";
  modal: boolean;
  onOpenChange?: ((open: boolean) => void) | undefined;
  shouldScaleBackground: boolean;
}

const meta = preview.type<{ args: DrawerArgs }>().meta({
  args: { direction: "bottom", modal: true, shouldScaleBackground: true },
  argTypes: {
    direction: { control: "radio", options: ["top", "right", "bottom", "left"] },
    modal: { control: "boolean" },
    onOpenChange: { table: { disable: true } },
    shouldScaleBackground: { control: "boolean" },
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
  subcomponents: {
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  },
  title: "Overlay/Drawer",
});

export const Default = meta.story({
  render: ({ direction, modal, onOpenChange, shouldScaleBackground }) => (
    <Drawer
      direction={direction}
      modal={modal}
      onOpenChange={onOpenChange}
      shouldScaleBackground={shouldScaleBackground}
    >
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

/** Same composition as `Default`, only the edge it enters from changes (driven by `args`). */
export const FromRight = meta.story({
  args: { direction: "right" },
  render: Default.input.render,
});

/** A distinct composition: one trigger per edge, demonstrating every `direction` at once. */
export const Sides = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
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

export const OpensOnClick = meta.story({
  args: { onOpenChange: fn() },
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
OpensOnClick.test("opens on click and reports open state", async ({ args, canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole("button", { name: /open drawer/i }));

  // Portalled content: query the document, not the canvas, and assert presence to ride out Vaul's animation.
  await expect(await screen.findByRole("dialog")).toBeInTheDocument();
  await expect(await screen.findByText(/make changes and save when done/i)).toBeInTheDocument();
  await expect(args.onOpenChange).toHaveBeenCalledWith(true);

  // Closing via the footer Close button drives the open state back to false.
  await userEvent.click(await screen.findByRole("button", { name: /cancel/i }));
  await waitFor(() => expect(args.onOpenChange).toHaveBeenCalledWith(false));
});
