import { Button } from "#/components/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/card";

import preview from "../.storybook/preview";

/**
 * Card — a COMPOSITE layout surface. The root `<Card>` is a styled `<div>` whose
 * only configurable prop is `size` (`"default" | "sm"`, driving the inner spacing
 * token); all other parts are thin styled `<div>`s composed as children. Content
 * here is authored for Storybook against the component's own public API and is NOT
 * synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { size: "default" },
  argTypes: {
    size: { control: "radio", options: ["default", "sm"] },
  },
  component: Card,
  parameters: {
    controls: { include: ["size"] },
    docs: {
      description: {
        component: [
          "A composable surface for grouping related content and actions. The root accepts a `size` prop that tightens the internal spacing.",
          "",
          "**Anatomy:** `Card > CardHeader (CardTitle · CardDescription · CardAction) + CardContent + CardFooter`.",
          "All parts are thin styled `<div>`s — compose only the ones you need.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter },
  title: "Layout/Card",
});

export const Default = meta.story({
  render: (args) => (
    <Card {...args} className="w-full max-w-xs">
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

/** Same composition, compact spacing — only `args` differ; the render is reused. */
export const Small = meta.story({
  args: { size: "sm" },
  render: Default.input.render,
});

/** A different composition that exercises the `CardAction` slot in the header. */
export const WithAction = meta.story({
  render: (args) => (
    <Card {...args} className="w-full max-w-sm">
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
