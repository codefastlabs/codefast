import { expect, screen } from "storybook/test";

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

const meta = preview.meta({
  args: { defaultOpen: false, modal: true },
  argTypes: {
    onOpenChange: { table: { disable: true } },
    open: { table: { disable: true } },
  },
  component: Dialog,
  subcomponents: {
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogBody,
    DialogFooter,
    DialogClose,
  },
  parameters: {
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

export const NoCloseButton = meta.story({
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">No Close Button</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>No Close Button</DialogTitle>
          <DialogDescription>This dialog doesn&apos;t have a close button in the top-right corner.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
});

export const ScrollableContent = meta.story({
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Scrollable Content</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scrollable Content</DialogTitle>
          <DialogDescription>This is a dialog with scrollable content.</DialogDescription>
        </DialogHeader>
        <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <p key={index} className="mb-4 leading-normal">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum.
            </p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  ),
});

export const OpensOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
OpensOnClick.test("opens on click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /open dialog/i });

  await userEvent.click(trigger);

  await expect(await screen.findByText(/edit profile/i)).toBeInTheDocument();
  await expect(await screen.findByText(/make changes here/i)).toBeInTheDocument();
});
