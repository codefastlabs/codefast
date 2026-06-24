import { ArrowUpRightIcon, BadgeCheck, BookmarkIcon } from "lucide-react";

import { Badge } from "#/components/badge";

import preview from "../.storybook/preview";

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
  },
  title: "Display/Badge",
});

export const Default = meta.story();

export const Variants = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  ),
});

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

export const CustomColors = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Blue</Badge>
      <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Green</Badge>
      <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">Sky</Badge>
      <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Purple</Badge>
      <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">Red</Badge>
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
