import type { Meta, StoryObj } from "@storybook/react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@codefast/ui/sheet";
import { Button } from "@codefast/ui/button";
import { Label } from "@codefast/ui/label";
import { Input } from "@codefast/ui/input";
import { useId } from "react";

const meta = {
  component: Sheet,
  tags: ["autodocs"],
  title: "UIs/Sheet",
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
            <SheetDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`name-${id}`} className="text-right">
                Name
              </Label>
              <Input
                id={`name-${id}`}
                value="Pedro Duarte"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`username-${id}`} className="text-right">
                Username
              </Label>
              <Input
                id={`username-${id}`}
                value="@peduarte"
                className="col-span-3"
              />
            </div>
          </div>
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

const SHEET_SIDES = ["top", "right", "bottom", "left"] as const;

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
                  Make changes to your profile here. Click save when
                  you&apos;`re done.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`name-${side}-${id}`} className="text-right">
                    Name
                  </Label>
                  <Input
                    id={`name-${side}-${id}`}
                    value="Pedro Duarte"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor={`username-${side}-${id}`}
                    className="text-right"
                  >
                    Username
                  </Label>
                  <Input
                    id={`username-${side}-${id}`}
                    value="@peduarte"
                    className="col-span-3"
                  />
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="submit">Save changes</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ))}
      </div>
    );
  },
};
