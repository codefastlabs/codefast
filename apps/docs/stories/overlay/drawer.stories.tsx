import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@codefast/ui/drawer';
import { type CSSProperties, type FormHTMLAttributes, type JSX, useState } from 'react';
import { Button } from '@codefast/ui/button';
import { Minus, Plus } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@codefast/ui/dialog';
import { cn } from '@codefast/ui/utils';
import { Label } from '@codefast/ui/label';
import { Box } from '@codefast/ui/box';
import { useMediaQuery } from '@codefast/hooks/use-media-query';
import { type Meta, type StoryObj } from '@storybook/react';
import { TextInput } from '@codefast/ui/text-input';

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

    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Open Drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <Box className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Move Goal</DrawerTitle>
              <DrawerDescription>Set your daily activity goal.</DrawerDescription>
            </DrawerHeader>
            <Box className="p-4 pb-0">
              <Box className="flex items-center justify-center space-x-2">
                <Button
                  className="size-8 shrink-0 rounded-full"
                  disabled={goal <= 200}
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    onClick(-10);
                  }}
                >
                  <Minus className="size-4" />
                  <Box as="span" className="sr-only">
                    Decrease
                  </Box>
                </Button>
                <Box className="flex-1 text-center">
                  <Box className="text-7xl font-bold tracking-tighter">{goal}</Box>
                  <Box className="text-muted-foreground text-[0.70rem] uppercase">Calories/day</Box>
                </Box>
                <Button
                  className="size-8 shrink-0 rounded-full"
                  disabled={goal >= 400}
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    onClick(10);
                  }}
                >
                  <Plus className="size-4" />
                  <Box as="span" className="sr-only">
                    Increase
                  </Box>
                </Button>
              </Box>
              <Box className="mt-3 h-[120px]">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={data}>
                    <Bar
                      dataKey="goal"
                      style={
                        {
                          fill: 'hsl(var(--foreground))',
                          opacity: 0.9,
                        } as CSSProperties
                      }
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
            <DrawerFooter>
              <Button>Submit</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </Box>
        </DrawerContent>
      </Drawer>
    );
  },
};

/* -----------------------------------------------------------------------------
 * Story: Responsive Dialog
 * -------------------------------------------------------------------------- */

function ProfileForm({ className }: FormHTMLAttributes<HTMLFormElement>): JSX.Element {
  return (
    <form className={cn('grid items-start gap-4', className)}>
      <Box className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <TextInput defaultValue="codefast@example.com" id="email" type="email" />
      </Box>
      <Box className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <TextInput defaultValue="@codefast" id="username" />
      </Box>
      <Button type="submit">Save changes</Button>
    </form>
  );
}

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
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <ProfileForm />
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
          <DrawerHeader className="text-left">
            <DrawerTitle>Edit profile</DrawerTitle>
            <DrawerDescription>Make changes to your profile here. Click save when you&apos;re done.</DrawerDescription>
          </DrawerHeader>
          <ProfileForm className="px-4" />
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
};