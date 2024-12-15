import type { Meta, StoryObj } from '@storybook/react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  PasswordInput,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextInput,
} from '@codefast/ui';

const meta = {
  component: Tabs,
  tags: ['autodocs'],
  title: 'UI/Tabs',
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof Tabs>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Tabs className="w-[400px]" defaultValue="account" {...args}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Make changes to your account here. Click save when you&apos;re done.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <TextInput defaultValue="Pedro Duarte" id="name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <TextInput defaultValue="@peduarte" id="username" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save changes</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password here. After saving, you&#39;ll be logged out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <PasswordInput id="current" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <PasswordInput id="new" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save password</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};
