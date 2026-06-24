import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "#/components/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/card";

const meta = {
  component: Card,
  title: "Layout/Card",
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Up to 20 seats, unlimited projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">
          $49<span className="text-sm font-normal text-muted-foreground">/mo</span>
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" size="sm">
          Upgrade now
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage how you receive updates.</CardDescription>
        <CardAction>
          <Button size="sm" variant="ghost">
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>You have 3 unread messages.</CardContent>
    </Card>
  ),
};
