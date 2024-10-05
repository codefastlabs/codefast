import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
  TextInput,
} from '@codefast/ui';
import { BellIcon, CheckIcon } from '@radix-ui/react-icons';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Card,
  tags: ['autodocs'],
  title: 'Components/Misc/Card',
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Card className="w-[350px]" {...args}>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <TextInput id="name" placeholder="Name of your project" />
            </div>
            <div className="flex flex-col space-y-1.5">
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
    title: 'Your call has been confirmed.',
    description: '1 hour ago',
  },
  {
    id: 2,
    title: 'You have a new message!',
    description: '1 hour ago',
  },
  {
    id: 3,
    title: 'Your subscription is expiring soon!',
    description: '2 hours ago',
  },
];

export const Examples: Story = {
  render: (args) => (
    <Card className="w-[380px]" {...args}>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center space-x-4 rounded-md border p-4">
          <BellIcon />
          <div className="flex-1 space-y-1">
            <Text className="text-sm font-medium leading-none">
              Push Notifications
            </Text>
            <Text className="text-muted-foreground text-sm">
              Send notifications to device.
            </Text>
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
                <Text className="text-sm font-medium leading-none">
                  {notification.title}
                </Text>
                <Text className="text-muted-foreground text-sm">
                  {notification.description}
                </Text>
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
