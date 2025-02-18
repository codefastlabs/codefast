import type { Meta, StoryObj } from '@storybook/react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
} from '@codefast/ui';
import { BellIcon, CheckIcon } from '@radix-ui/react-icons';

const meta = {
  component: Card,
  tags: ['autodocs'],
  title: 'UI/Card',
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof Card>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Card className="w-[21.875rem]" {...args}>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col gap-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Name of your project" />
            </div>
            <div className="flex flex-col gap-y-1.5">
              <Label htmlFor="framework">Framework</Label>
              <Select>
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next">Next.js</SelectItem>
                  <SelectItem value="sveltekit">SvelteKit</SelectItem>
                  <SelectItem value="astro">Astro</SelectItem>
                  <SelectItem value="nuxt">Nuxt.js</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Examples
 * -------------------------------------------------------------------------- */

const notifications = [
  {
    id: 1,
    description: '1 hour ago',
    title: 'Your call has been confirmed.',
  },
  {
    id: 2,
    description: '1 hour ago',
    title: 'You have a new message!',
  },
  {
    id: 3,
    description: '2 hours ago',
    title: 'Your subscription is expiring soon!',
  },
];

export const Examples: Story = {
  render: (args) => (
    <Card className="w-[23.75rem]" {...args}>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-x-4 rounded-md border p-4">
          <BellIcon />
          <div className="flex-1 space-y-1">
            <Text className="text-sm font-medium leading-none">Push Notifications</Text>
            <Text className="text-muted-foreground text-sm">Send notifications to device.</Text>
          </div>
          <Switch />
        </div>
        <div>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
            >
              <span className="flex size-2 translate-y-1 rounded-full bg-sky-500" />
              <div className="space-y-1">
                <Text className="text-sm font-medium leading-none">{notification.title}</Text>
                <Text className="text-muted-foreground text-sm">{notification.description}</Text>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" prefix={<CheckIcon />}>
          Mark all as read
        </Button>
      </CardFooter>
    </Card>
  ),
};
