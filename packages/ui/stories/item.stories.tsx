import { MoreHorizontalIcon, ShieldAlertIcon } from "lucide-react";
import { expect, fn } from "storybook/test";

import { Avatar, AvatarFallback } from "#/components/avatar";
import { Badge } from "#/components/badge";
import { Button } from "#/components/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "#/components/item";

import preview from "../.storybook/preview";

/**
 * Item is a COMPOSITE row whose Root is a plain `<div>` carrying two enum props
 * (`variant`, `size`). The Root is bound as `component` so `{...args}` drives the
 * Controls; sub-states reuse the base `render` and differ only by `args`. Content
 * is authored for Storybook, NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { size: "default", variant: "default" },
  argTypes: {
    asChild: { table: { disable: true } },
    size: { control: "radio", options: ["default", "sm", "xs"] },
    variant: { control: "radio", options: ["default", "muted", "outline"] },
  },
  component: Item,
  parameters: {
    controls: { include: ["variant", "size"] },
    docs: {
      description: {
        component: [
          "A flexible row for presenting an entity with leading media, text, and trailing actions.",
          "",
          "**Anatomy:** `ItemGroup > Item > (ItemMedia + ItemContent (ItemTitle · ItemDescription) + ItemActions)`, separated by `ItemSeparator`.",
          "`Item` accepts `variant` and `size`; use `ItemHeader`/`ItemFooter` for full-width rows above and below the main content.",
        ].join("\n"),
      },
    },
  },
  subcomponents: {
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemFooter,
    ItemGroup,
    ItemHeader,
    ItemMedia,
    ItemSeparator,
    ItemTitle,
  },
  title: "Display/Item",
});

export const Default = meta.story({
  render: (args) => (
    <Item {...args} className="w-full max-w-md">
      <ItemMedia>
        <Avatar>
          <AvatarFallback className="bg-primary text-white">VP</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Vuong Phan</ItemTitle>
        <ItemDescription>mr.thevuong@gmail.com</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Badge variant="default">Owner</Badge>
        <Button aria-label="Options for Vuong Phan" size="icon-sm" variant="ghost">
          <MoreHorizontalIcon />
        </Button>
      </ItemActions>
    </Item>
  ),
});

export const Outline = meta.story({
  args: { variant: "outline" },
  render: Default.input.render,
});

export const Muted = meta.story({
  args: { variant: "muted" },
  render: Default.input.render,
});

export const Small = meta.story({
  args: { size: "sm", variant: "outline" },
  render: Default.input.render,
});

export const ExtraSmall = meta.story({
  args: { size: "xs", variant: "outline" },
  render: Default.input.render,
});

/** A genuinely different composition: a grouped list with a trailing text action. */
export const Group = meta.story({
  render: () => (
    <ItemGroup className="w-full max-w-lg">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <ShieldAlertIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Security Alert</ItemTitle>
          <ItemDescription>New login detected from unknown device.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline">
            Review
          </Button>
        </ItemActions>
      </Item>
      <ItemSeparator />
      <Item variant="outline">
        <ItemMedia>
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Jane Doe</ItemTitle>
          <ItemDescription>jane@example.com</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Badge variant="secondary">Member</Badge>
        </ItemActions>
      </Item>
      <ItemFooter className="px-1 text-xs text-muted-foreground">2 members</ItemFooter>
    </ItemGroup>
  ),
});

const onReview = fn();

export const ActionFires = meta.story({
  args: { variant: "outline" },
  render: (args) => (
    <Item {...args} className="w-full max-w-md">
      <ItemMedia variant="icon">
        <ShieldAlertIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Security Alert</ItemTitle>
        <ItemDescription>New login detected from unknown device.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button onClick={onReview} size="sm" variant="outline">
          Review
        </Button>
      </ItemActions>
    </Item>
  ),
});

ActionFires.test("invokes the trailing action when clicked", async ({ canvas, userEvent }) => {
  onReview.mockClear();
  await userEvent.click(canvas.getByRole("button", { name: "Review" }));

  await expect(onReview).toHaveBeenCalledTimes(1);
});
