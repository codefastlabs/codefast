import { expect, fn, screen } from "storybook/test";

import { Button } from "#/components/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/dialog";
import { Input } from "#/components/input";
import { Label } from "#/components/label";

import preview from "../.storybook/preview";

/**
 * Dialog — a COMPOSITE modal overlay built on Radix `Dialog.Root`. The root is a
 * stateful controller (open/defaultOpen/modal/onOpenChange); the visible UI lives
 * in portalled subcomponents (Content, Header, Body, Footer, …). Args drive the
 * ROOT controller; the composition is reused across states via `Default.input.render`.
 * Content here is authored for Storybook and is NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { defaultOpen: false, modal: true },
  argTypes: {
    defaultOpen: { control: "boolean" },
    modal: { control: "boolean" },
    onOpenChange: { table: { disable: true } },
    open: { table: { disable: true } },
  },
  component: Dialog,
  parameters: {
    controls: { include: ["defaultOpen", "modal"] },
    docs: {
      description: {
        component: [
          "A modal overlay that interrupts the page to focus the user on a single task.",
          "",
          "**Anatomy:** `Dialog > DialogTrigger + DialogContent > (DialogHeader (DialogTitle · DialogDescription) + DialogBody + DialogFooter (DialogClose))`.",
          "Wrap the activator in `DialogTrigger asChild`; `DialogContent` renders in a portal with a backdrop and focus trap.",
        ].join("\n"),
      },
    },
  },
  subcomponents: {
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  },
  title: "Overlay/Dialog",
});

export const Default = meta.story({
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Make changes here. Click save when done.</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="dialog-name">Name</Label>
            <Input id="dialog-name" defaultValue="Vuong Phan" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dialog-user">Username</Label>
            <Input id="dialog-user" defaultValue="@vuongphan" />
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button size="sm">Save changes</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
});

/** A distinct composition: `DialogContent showCloseButton={false}` hides the top-right close affordance. */
export const NoCloseButton = meta.story({
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">No close button</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>No close button</DialogTitle>
          <DialogDescription>This dialog has no close button in the top-right corner.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
});

/** A distinct composition: tall content scrolls inside the dialog while the chrome stays pinned. */
export const ScrollableContent = meta.story({
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">Scrollable content</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scrollable content</DialogTitle>
          <DialogDescription>The body scrolls; the header stays pinned.</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <p key={index} className="leading-normal">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur.
            </p>
          ))}
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
});

export const OpensOnClick = meta.story({
  args: { onOpenChange: fn() },
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
OpensOnClick.test("opens on click and fires onOpenChange", async ({ args, canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /open dialog/i });

  await userEvent.click(trigger);

  // Portalled content lives outside the canvas — query the document via screen.
  await expect(await screen.findByText(/edit profile/i)).toBeInTheDocument();
  await expect(await screen.findByText(/make changes here/i)).toBeInTheDocument();
  await expect(args.onOpenChange).toHaveBeenCalledWith(true);
});
