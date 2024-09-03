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
} from '@codefast/ui/dialog';
import { Button } from '@codefast/ui/button';
import { Label } from '@codefast/ui/label';
import { Copy } from 'lucide-react';
import { Box } from '@codefast/ui/box';
import { type Meta, type StoryObj } from '@storybook/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@codefast/ui/tooltip';
import { TextInput } from '@codefast/ui/text-input';
import { useState } from 'react';

const meta = {
  component: Dialog,
  tags: ['autodocs'],
  title: 'Components/Overlay/Dialog',
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <Dialog open={open} onOpenChange={setOpen} {...args}>
        <DialogTrigger asChild>
          <Button variant="outline">Edit Profile</Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Make changes to your profile here. Click save when you&apos;re done.</DialogDescription>
          </DialogHeader>

          <DialogBody>
            <Box className="grid gap-4 py-4">
              <Box className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor="name">
                  Name
                </Label>
                <TextInput className="col-span-3" defaultValue="Pedro Duarte" id="name" />
              </Box>
              <Box className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor="username">
                  Username
                </Label>
                <TextInput className="col-span-3" defaultValue="@peduarte" id="username" />
              </Box>
            </Box>
          </DialogBody>

          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <Button
              type="submit"
              onClick={() => {
                setOpen(false);
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Custom Close Button
 * -------------------------------------------------------------------------- */

export const CustomCloseButton: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">Share</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>Anyone who has this link will be able to view this.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Box className="flex items-center gap-2">
            <Box className="grid flex-1 gap-2">
              <Label className="sr-only" htmlFor="link">
                Link
              </Label>
              <TextInput readOnly defaultValue="https://ui.shadcn.com/docs/installation" id="link" />
            </Box>
            <TooltipProvider delayDuration={250}>
              <Tooltip>
                <TooltipTrigger>
                  <Button size="icon">
                    <Box as="span" className="sr-only">
                      Copy
                    </Box>
                    <Copy className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Box>
        </DialogBody>

        <DialogFooter>
          <DialogClose>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Scrollable
 * -------------------------------------------------------------------------- */

export const Scrollable: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">Share</Button>
      </DialogTrigger>

      <DialogContent className="max-h-full overflow-auto">
        <DialogHeader>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>Anyone who has this link will be able to view this.</DialogDescription>
        </DialogHeader>

        <DialogBody className="border-y">
          <div className="grid gap-2 py-4">
            {Array.from({ length: 40 }, (_, k) => ({ id: k })).map(({ id }) => (
              <p key={id}>
                {id} Lorem ipsum dolor sit amet, consectetur adipisicing elit. Beatae dicta dolores, eligendi est
                officia voluptatem? Corporis culpa debitis ipsa ipsam maiores, nisi odit perspiciatis possimus quae,
                quos totam voluptas voluptatibus.
              </p>
            ))}
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Scrolling Long Content
 * -------------------------------------------------------------------------- */

export const ScrollingLongContent: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">Share</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>Anyone who has this link will be able to view this.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="grid gap-2">
            {Array.from({ length: 40 }, (_, k) => ({ id: k })).map(({ id }) => (
              <p key={id}>
                {id} Lorem ipsum dolor sit amet, consectetur adipisicing elit. Beatae dicta dolores, eligendi est
                officia voluptatem? Corporis culpa debitis ipsa ipsam maiores, nisi odit perspiciatis possimus quae,
                quos totam voluptas voluptatibus.
              </p>
            ))}
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
