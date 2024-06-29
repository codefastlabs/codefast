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
import { Input } from '@codefast/ui/input';
import { Copy } from 'lucide-react';
import { Box } from '@codefast/ui/box';
import { type Meta, type StoryObj } from '@storybook/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@codefast/ui/tooltip';

const meta = {
  component: Dialog,
  tags: ['autodocs'],
  title: 'UIs/Dialog',
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Dialog {...args}>
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
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
            </Box>
            <Box className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input id="username" defaultValue="@peduarte" className="col-span-3" />
            </Box>
          </Box>
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit">Save changes</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
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
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input id="link" defaultValue="https://ui.shadcn.com/docs/installation" readOnly />
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

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
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

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
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

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
