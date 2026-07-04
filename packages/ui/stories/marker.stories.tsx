import { CalendarIcon } from "lucide-react";

import { Marker, MarkerContent, MarkerIcon } from "#/components/marker";

import preview from "../.storybook/preview";

/**
 * Marker — an inline divider for a message feed (a date, an unread line, a
 * section label). Content here is authored against Marker's own public API for
 * Storybook, NOT synced with the apps/web registry.
 *
 * **Anatomy:** `Marker > (MarkerIcon?) + MarkerContent`.
 */
const meta = preview.meta({
  args: { variant: "default" },
  argTypes: {
    asChild: { table: { disable: true } },
    variant: { control: "radio", options: ["default", "separator", "border"] },
  },
  component: Marker,
  parameters: {
    controls: { include: ["variant"] },
    docs: {
      description: {
        component:
          "A horizontal divider that labels a point in a feed. The `separator` variant centers the label between two rules; `border` underlines a section.",
      },
    },
  },
  subcomponents: { MarkerContent, MarkerIcon },
  title: "Chat/Marker",
});

export const Default = meta.story({
  render: (args) => (
    <Marker {...args} className="w-full max-w-md">
      <MarkerIcon>
        <CalendarIcon />
      </MarkerIcon>
      <MarkerContent>Today</MarkerContent>
    </Marker>
  ),
});

export const Separator = meta.story({
  args: { variant: "separator" },
  render: (args) => (
    <Marker {...args} className="w-full max-w-md">
      <MarkerContent>December 12</MarkerContent>
    </Marker>
  ),
});

export const Border = meta.story({
  args: { variant: "border" },
  render: (args) => (
    <Marker {...args} className="w-full max-w-md">
      <MarkerContent>Yesterday</MarkerContent>
    </Marker>
  ),
});
