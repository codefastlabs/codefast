import { MoreHorizontalIcon, ShieldAlertIcon, InboxIcon } from "lucide-react";
import { Fragment } from "react";

import { Avatar, AvatarFallback } from "#/components/avatar";
import { Badge } from "#/components/badge";
import { Button } from "#/components/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "#/components/item";
import { cn } from "#/lib/utils";

import preview from "../.storybook/preview";

/**
 * Item is a composition with optional root props. Demoed via `render` while
 * keeping `component` bound to the Root (Pattern C, see Card).
 */
const meta = preview.meta({
  component: Item,
  title: "Display/Item",
});

const MEMBERS = [
  {
    id: 1,
    name: "Vuong Phan",
    email: "mr.thevuong@gmail.com",
    role: "Owner",
    initials: "VP",
    color: "bg-primary",
    roleVariant: "default" as const,
  },
  {
    id: 2,
    name: "Sarah Müller",
    email: "sarah@acme.io",
    role: "Admin",
    initials: "SM",
    color: "bg-violet-500",
    roleVariant: "secondary" as const,
  },
  {
    id: 3,
    name: "James Doe",
    email: "james@acme.io",
    role: "Member",
    initials: "JD",
    color: "bg-emerald-500",
    roleVariant: "outline" as const,
  },
];

export const Default = meta.story({
  render: () => (
    <ItemGroup className="w-full max-w-md gap-0 rounded-xl border">
      {MEMBERS.map(({ id, name, email, role, initials, color, roleVariant }, idx) => (
        <Fragment key={id}>
          {idx > 0 && <ItemSeparator className="my-0" />}
          <Item>
            <ItemMedia>
              <Avatar>
                <AvatarFallback className={cn("text-white", color)}>{initials}</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{name}</ItemTitle>
              <ItemDescription>{email}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge variant={roleVariant}>{role}</Badge>
              <Button aria-label={`Options for ${name}`} size="icon-sm" variant="ghost">
                <MoreHorizontalIcon />
              </Button>
            </ItemActions>
          </Item>
        </Fragment>
      ))}
    </ItemGroup>
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
