import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Label,
  TextInput,
} from '@codefast/ui';
import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer } from 'recharts';
import { useMediaQuery } from '@codefast/hooks';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Drawer,
  tags: ['autodocs'],
  title: 'Components/Overlay/Drawer',
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

const data = [
  {
    goal: 400,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 239,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 349,
  },
];

export const Default: Story = {
  render: () => {
    const [goal, setGoal] = useState(350);

    function onClick(adjustment: number): void {
      setGoal(Math.max(200, Math.min(400, goal + adjustment)));
    }

    const [open, setOpen] = useState(false);

    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline">Open Drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Move Goal</DrawerTitle>
              <DrawerDescription>
                Set your daily activity goal.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  icon
                  aria-label="Decrease"
                  className="size-8 shrink-0 rounded-full"
                  disabled={goal <= 200}
                  prefix={<Minus />}
                  variant="outline"
                  onClick={() => {
                    onClick(-10);
                  }}
                />
                <div className="flex-1 text-center">
                  <div className="text-7xl font-bold tracking-tighter">
                    {goal}
                  </div>
                  <div className="text-muted-foreground text-[0.70rem] uppercase">
                    Calories/day
                  </div>
                </div>
                <Button
                  icon
                  aria-label="Increase"
                  className="size-8 shrink-0 rounded-full"
                  disabled={goal >= 400}
                  prefix={<Plus />}
                  variant="outline"
                  onClick={() => {
                    onClick(10);
                  }}
                />
              </div>
              <div className="mt-3 h-[120px]">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={data}>
                    <Bar
                      dataKey="goal"
                      style={{
                        fill: 'hsl(var(--foreground))',
                        opacity: 0.9,
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <DrawerFooter>
              <DrawerClose>Cancel</DrawerClose>
              <DrawerClose variant="default">Submit</DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Responsive Dialog
 * -------------------------------------------------------------------------- */

export const ResponsiveDialog: Story = {
  render: (args) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [open, setOpen] = useState(false);

    if (isDesktop) {
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Edit Profile</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form>
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you&apos;re
                  done.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="grid items-start gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <TextInput
                    defaultValue="codefast@example.com"
                    id="email"
                    type="email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <TextInput defaultValue="@codefast" id="username" />
                </div>
              </DialogBody>
              <DialogFooter>
                <DialogClose
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Cancel
                </DialogClose>
                <DialogClose
                  variant="default"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Save changes
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={open} onOpenChange={setOpen} {...args}>
        <DrawerTrigger asChild>
          <Button variant="outline">Edit Profile</Button>
        </DrawerTrigger>
        <DrawerContent>
          <form>
            <DrawerHeader className="text-left">
              <DrawerTitle>Edit profile</DrawerTitle>
              <DrawerDescription>
                Make changes to your profile here. Click save when you&apos;re
                done.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerBody className="grid items-start gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <TextInput
                  defaultValue="codefast@example.com"
                  id="email"
                  type="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <TextInput defaultValue="@codefast" id="username" />
              </div>
            </DrawerBody>
            <DrawerFooter className="pt-2">
              <DrawerClose>Cancel</DrawerClose>
              <DrawerClose variant="default">Save changes</DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    );
  },
};
