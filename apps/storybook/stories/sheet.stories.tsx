import type { Meta, StoryObj } from '@storybook/react';

import {
  Button,
  Label,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  TextInput,
} from '@codefast/ui';
import { useId } from 'react';

const meta = {
  component: Sheet,
  tags: ['autodocs'],
  title: 'UI/Sheet',
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof Sheet>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => {
    const id = useId();

    return (
      <Sheet {...args}>
        <SheetTrigger asChild>
          <Button variant="outline">Open</Button>
        </SheetTrigger>

        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>
              Make changes to your profile here. Click save when you&apos;re done.
            </SheetDescription>
          </SheetHeader>

          <SheetBody>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor={`name-${id}`}>
                  Name
                </Label>
                <TextInput className="col-span-3" id={`name-${id}`} value="Pedro Duarte" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor={`username-${id}`}>
                  Username
                </Label>
                <TextInput className="col-span-3" id={`username-${id}`} value="@peduarte" />
              </div>
            </div>
          </SheetBody>

          <SheetFooter>
            <SheetClose variant="default">Save changes</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Side
 * -------------------------------------------------------------------------- */

const SHEET_SIDES = ['top', 'right', 'bottom', 'left'] as const;

export const Side: Story = {
  render: (args) => {
    const id = useId();

    return (
      <div className="grid grid-cols-2 gap-2">
        {SHEET_SIDES.map((side) => (
          <Sheet key={side} {...args}>
            <SheetTrigger asChild>
              <Button variant="outline">{side}</Button>
            </SheetTrigger>

            <SheetContent side={side}>
              <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>
                  Make changes to your profile here. Click save when you&apos;re done.
                </SheetDescription>
              </SheetHeader>

              <SheetBody>
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right" htmlFor={`name-${side}-${id}`}>
                      Name
                    </Label>
                    <TextInput
                      className="col-span-3"
                      id={`name-${side}-${id}`}
                      value="Pedro Duarte"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right" htmlFor={`username-${side}-${id}`}>
                      Username
                    </Label>
                    <TextInput
                      className="col-span-3"
                      id={`username-${side}-${id}`}
                      value="@peduarte"
                    />
                  </div>
                </div>
              </SheetBody>

              <SheetFooter>
                <SheetClose variant="default">Save changes</SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ))}
      </div>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Scrollable
 * -------------------------------------------------------------------------- */

export const Scrollable: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-2">
      {SHEET_SIDES.map((side) => (
        <Sheet key={side} {...args}>
          <SheetTrigger asChild>
            <Button variant="outline">{side}</Button>
          </SheetTrigger>

          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>Share link</SheetTitle>
              <SheetDescription>
                Anyone who has this link will be able to view this.
              </SheetDescription>
            </SheetHeader>

            <SheetBody className="grow overflow-auto border-y">
              <div className="grid gap-2">
                {Array.from({ length: 40 }, (_, k) => ({ id: k })).map(({ id }) => (
                  <p key={id}>
                    {id} Lorem ipsum dolor sit amet, consectetur adipisicing elit. Beatae dicta
                    dolores, eligendi est officia voluptatem? Corporis culpa debitis ipsa ipsam
                    maiores, nisi odit perspiciatis possimus quae, quos totam voluptas voluptatibus.
                  </p>
                ))}
              </div>
            </SheetBody>

            <SheetFooter>
              <SheetClose>Close</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: ScrollingLongContent
 * -------------------------------------------------------------------------- */

export const ScrollingLongContent: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-2">
      {SHEET_SIDES.map((side) => (
        <Sheet key={side} {...args}>
          <SheetTrigger asChild>
            <Button variant="outline">{side}</Button>
          </SheetTrigger>

          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>Share link</SheetTitle>
              <SheetDescription>
                Anyone who has this link will be able to view this.
              </SheetDescription>
            </SheetHeader>

            <SheetBody className="border-y">
              <div className="grid gap-2">
                {Array.from({ length: 40 }, (_, k) => ({ id: k })).map(({ id }) => (
                  <p key={id}>
                    {id} Lorem ipsum dolor sit amet, consectetur adipisicing elit. Beatae dicta
                    dolores, eligendi est officia voluptatem? Corporis culpa debitis ipsa ipsam
                    maiores, nisi odit perspiciatis possimus quae, quos totam voluptas voluptatibus.
                  </p>
                ))}
              </div>
            </SheetBody>

            <SheetFooter>
              <SheetClose>Close</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  ),
};
