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
} from '@codefast/ui/sheet';
import { Button } from '@codefast/ui/button';
import { Label } from '@codefast/ui/label';
import { useId } from 'react';
import { Box } from '@codefast/ui/box';
import { type Meta, type StoryObj } from '@storybook/react';
import { TextInput } from '@codefast/ui/text-input';

const meta = {
  component: Sheet,
  tags: ['autodocs'],
  title: 'Components/Overlay/Sheet',
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

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
            <SheetDescription>Make changes to your profile here. Click save when you&apos;re done.</SheetDescription>
          </SheetHeader>

          <SheetBody>
            <Box className="grid gap-4">
              <Box className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor={`name-${id}`}>
                  Name
                </Label>
                <TextInput className="col-span-3" id={`name-${id}`} value="Pedro Duarte" />
              </Box>
              <Box className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor={`username-${id}`}>
                  Username
                </Label>
                <TextInput className="col-span-3" id={`username-${id}`} value="@peduarte" />
              </Box>
            </Box>
          </SheetBody>

          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit">Save changes</Button>
            </SheetClose>
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
      <Box className="grid grid-cols-2 gap-2">
        {SHEET_SIDES.map((side) => (
          <Sheet key={side} {...args}>
            <SheetTrigger asChild>
              <Button variant="outline">{side}</Button>
            </SheetTrigger>

            <SheetContent side={side}>
              <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>
                  Make changes to your profile here. Click save when you&apos;`re done.
                </SheetDescription>
              </SheetHeader>

              <SheetBody>
                <Box className="grid gap-4">
                  <Box className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right" htmlFor={`name-${side}-${id}`}>
                      Name
                    </Label>
                    <TextInput className="col-span-3" id={`name-${side}-${id}`} value="Pedro Duarte" />
                  </Box>
                  <Box className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right" htmlFor={`username-${side}-${id}`}>
                      Username
                    </Label>
                    <TextInput className="col-span-3" id={`username-${side}-${id}`} value="@peduarte" />
                  </Box>
                </Box>
              </SheetBody>

              <SheetFooter>
                <SheetClose asChild>
                  <Button type="submit">Save changes</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ))}
      </Box>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Scrollable
 * -------------------------------------------------------------------------- */

export const Scrollable: Story = {
  render: (args) => (
    <Box className="grid grid-cols-2 gap-2">
      {SHEET_SIDES.map((side) => (
        <Sheet key={side} {...args}>
          <SheetTrigger asChild>
            <Button variant="outline">{side}</Button>
          </SheetTrigger>

          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>Share link</SheetTitle>
              <SheetDescription>Anyone who has this link will be able to view this.</SheetDescription>
            </SheetHeader>

            <SheetBody className="grow overflow-auto border-y">
              <div className="grid gap-2">
                {Array.from({ length: 40 }, (_, k) => ({ id: k })).map(({ id }) => (
                  <p key={id}>
                    {id} Lorem ipsum dolor sit amet, consectetur adipisicing elit. Beatae dicta dolores, eligendi est
                    officia voluptatem? Corporis culpa debitis ipsa ipsam maiores, nisi odit perspiciatis possimus quae,
                    quos totam voluptas voluptatibus.
                  </p>
                ))}
              </div>
            </SheetBody>

            <SheetFooter>
              <SheetClose asChild>
                <Button type="submit">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </Box>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: ScrollingLongContent
 * -------------------------------------------------------------------------- */

export const ScrollingLongContent: Story = {
  render: (args) => (
    <Box className="grid grid-cols-2 gap-2">
      {SHEET_SIDES.map((side) => (
        <Sheet key={side} {...args}>
          <SheetTrigger asChild>
            <Button variant="outline">{side}</Button>
          </SheetTrigger>

          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>Share link</SheetTitle>
              <SheetDescription>Anyone who has this link will be able to view this.</SheetDescription>
            </SheetHeader>

            <SheetBody className="border-y">
              <div className="grid gap-2">
                {Array.from({ length: 40 }, (_, k) => ({ id: k })).map(({ id }) => (
                  <p key={id}>
                    {id} Lorem ipsum dolor sit amet, consectetur adipisicing elit. Beatae dicta dolores, eligendi est
                    officia voluptatem? Corporis culpa debitis ipsa ipsam maiores, nisi odit perspiciatis possimus quae,
                    quos totam voluptas voluptatibus.
                  </p>
                ))}
              </div>
            </SheetBody>

            <SheetFooter>
              <SheetClose asChild>
                <Button type="submit">Close</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </Box>
  ),
};