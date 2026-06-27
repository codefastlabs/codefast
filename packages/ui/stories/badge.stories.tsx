import { ArrowUpRightIcon, BadgeCheck, BookmarkIcon } from "lucide-react";

import { Badge } from "#/components/badge";

import preview from "../.storybook/preview";

/**
 * Badge — a prop-driven display leaf. The root `<span>` owns the only interesting prop
 * (`variant`); everything else is plain content. Content here is authored against Badge's
 * own public API for Storybook, NOT synced with or copied from the apps/web registry.
 */
const meta = preview.meta({
  args: { children: "Badge", variant: "default" },
  argTypes: {
    asChild: { table: { disable: true } },
    children: { control: "text" },
    variant: {
      control: "radio",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
  },
  component: Badge,
  parameters: {
    controls: { include: ["variant", "children"] },
    docs: {
      description: {
        component:
          "A small label for status, counts, or categorization. Ships six visual variants and renders inline; pass `asChild` to project the badge styling onto another element (e.g. a link).",
      },
    },
  },
  title: "Display/Badge",
});

export const Default = meta.story();

export const Secondary = meta.story({ args: { variant: "secondary" } });

export const Destructive = meta.story({ args: { variant: "destructive" } });

export const Outline = meta.story({ args: { variant: "outline" } });

export const Ghost = meta.story({ args: { variant: "ghost" } });

export const Link = meta.story({ args: { variant: "link" } });

export const WithIcon = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">
        <BadgeCheck data-icon="inline-start" />
        Verified
      </Badge>
      <Badge variant="outline">
        Bookmark
        <BookmarkIcon data-icon="inline-end" />
      </Badge>
    </div>
  ),
});

export const AsLink = meta.story({
  render: () => (
    <Badge asChild>
      <a href="#link">
        Open Link <ArrowUpRightIcon data-icon="inline-end" />
      </a>
    </Badge>
  ),
});
