import { MoreHorizontalIcon, ShieldAlertIcon, InboxIcon } from "lucide-react";

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
 * Item is a composition with optional root props. Demoed via `render` while
 * keeping `component` bound to the Root (Pattern C, see Card).
 */
const meta = preview.meta({
  args: { size: "default", variant: "default" },
  argTypes: {
    asChild: { table: { disable: true } },
  },
  component: Item,
  subcomponents: {
    ItemGroup,
    ItemMedia,
    ItemContent,
    ItemTitle,
    ItemDescription,
    ItemActions,
    ItemHeader,
    ItemFooter,
    ItemSeparator,
  },
  parameters: {
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

export const Variants = meta.story({
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Item>
        <ItemMedia variant="icon">
          <InboxIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Default Variant</ItemTitle>
          <ItemDescription>Transparent background with no border.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <InboxIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Outline Variant</ItemTitle>
          <ItemDescription>Outlined style with a visible border.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="muted">
        <ItemMedia variant="icon">
          <InboxIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Muted Variant</ItemTitle>
          <ItemDescription>Muted background for secondary content.</ItemDescription>
        </ItemContent>
      </Item>
    </div>
  ),
});

export const Sizes = meta.story({
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <InboxIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Default Size</ItemTitle>
          <ItemDescription>The standard size for most use cases.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline" size="sm">
        <ItemMedia variant="icon">
          <InboxIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Small Size</ItemTitle>
          <ItemDescription>A compact size for dense layouts.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline" size="xs">
        <ItemMedia variant="icon">
          <InboxIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Extra Small Size</ItemTitle>
          <ItemDescription>The most compact size available.</ItemDescription>
        </ItemContent>
      </Item>
    </div>
  ),
});

export const WithIconAction = meta.story({
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
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
    </div>
  ),
});
