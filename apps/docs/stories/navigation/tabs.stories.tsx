import { Tabs, TabsContent, TabsList, TabsTrigger } from '@codefast/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@codefast/ui/card';
import { Label } from '@codefast/ui/label';
import { Button } from '@codefast/ui/button';
import { Box } from '@codefast/ui/box';
import { type Meta, type StoryObj } from '@storybook/react';
import { TextInput } from '@codefast/ui/text-input';

const meta = {
  component: Tabs,
  tags: ['autodocs'],
  title: 'Components/Navigation/Tabs',
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

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
            <Box className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <TextInput defaultValue="Pedro Duarte" id="name" />
            </Box>
            <Box className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <TextInput defaultValue="@peduarte" id="username" />
            </Box>
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
            <CardDescription>Change your password here. After saving, you'll be logged out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Box className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <TextInput id="current" type="password" />
            </Box>
            <Box className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <TextInput id="new" type="password" />
            </Box>
          </CardContent>
          <CardFooter>
            <Button>Save password</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};
