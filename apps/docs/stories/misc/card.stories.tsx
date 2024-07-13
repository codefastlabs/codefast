import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@codefast/ui/card';
import { Label } from '@codefast/ui/label';
import { Input } from '@codefast/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@codefast/ui/select';
import { Button } from '@codefast/ui/button';
import { BellIcon, CheckIcon } from '@radix-ui/react-icons';
import { Switch } from '@codefast/ui/switch';
import { Box } from '@codefast/ui/box';
import { Text } from '@codefast/ui/text';
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
          <Box className="grid w-full items-center gap-4">
            <Box className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Name of your project" />
            </Box>
            <Box className="flex flex-col space-y-1.5">
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
            </Box>
          </Box>
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
        <Box className="flex items-center space-x-4 rounded-md border p-4">
          <BellIcon />
          <Box className="flex-1 space-y-1">
            <Text className="text-sm font-medium leading-none">Push Notifications</Text>
            <Text className="text-muted-foreground text-sm">Send notifications to device.</Text>
          </Box>
          <Switch />
        </Box>
        <Box>
          {notifications.map((notification) => (
            <Box key={notification.id} className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
              <Box as="span" className="flex size-2 translate-y-1 rounded-full bg-sky-500" />
              <Box className="space-y-1">
                <Text className="text-sm font-medium leading-none">{notification.title}</Text>
                <Text className="text-muted-foreground text-sm">{notification.description}</Text>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          <CheckIcon className="mr-2 size-4" /> Mark all as read
        </Button>
      </CardFooter>
    </Card>
  ),
};
