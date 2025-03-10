import type { Meta, StoryObj } from '@storybook/react';

import {
  Box,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  InputPassword,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
    <Tabs className="w-[25rem]" defaultValue="account" {...args}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger disabled value="disabled">
          Disabled
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Make changes to your account here. Click save when you&apos;re done.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input defaultValue="Pedro Duarte" id="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input defaultValue="@peduarte" id="username" />
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <InputPassword id="current" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <InputPassword id="new" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save password</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="disabled">
        <Box>
          <h1>Disabled</h1>
        </Box>
      </TabsContent>
    </Tabs>
  ),
};
