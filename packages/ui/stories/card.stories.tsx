import { Button } from "#/components/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/card";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: Card,
  subcomponents: { CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter },
  parameters: {
    docs: {
      description: {
        component: [
          "A composable surface for grouping related content and actions.",
          "",
          "**Anatomy:** `Card > CardHeader (CardTitle · CardDescription · CardAction) + CardContent + CardFooter`.",
          "All parts are thin styled `<div>`s — compose only the ones you need.",
        ].join("\n"),
      },
    },
  },
  title: "Layout/Card",
});

export const Default = meta.story({
  render: () => (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Up to 20 seats, unlimited projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">
          $49
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" size="sm">
          Upgrade now
        </Button>
      </CardFooter>
    </Card>
  ),
});

export const WithAction = meta.story({
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
});
