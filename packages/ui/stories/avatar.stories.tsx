import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "#/components/avatar";

import preview from "../.storybook/preview";

/**
 * Avatar — a COMPOSITE whose root (`Avatar`) is a normal element with a single
 * enum prop (`size`). The root is bound as `component` so `{...args}` drives the
 * `size` control; state stories reuse the base render and differ only by `args`.
 * Content is authored for Storybook, NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { size: "default" },
  argTypes: {
    asChild: { table: { disable: true } },
    size: { control: "radio", options: ["sm", "default", "lg"] },
  },
  component: Avatar,
  parameters: {
    controls: { include: ["size"] },
    docs: {
      description: {
        component: [
          "An image element with a text fallback for representing a user or entity.",
          "",
          "**Anatomy:** `Avatar > (AvatarImage + AvatarFallback + AvatarBadge)`; stack many inside `AvatarGroup > … + AvatarGroupCount`.",
          "The fallback shows while the image loads or if it fails; pick a size with the `size` prop (`sm` · `default` · `lg`).",
        ].join("\n"),
      },
    },
  },
  subcomponents: { AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage },
  title: "Display/Avatar",
});

export const Default = meta.story({
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage alt="@codefast" className="grayscale" src="https://github.com/codefastlabs.png" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
});

export const Small = meta.story({
  args: { size: "sm" },
  render: Default.input.render,
});

export const Large = meta.story({
  args: { size: "lg" },
  render: Default.input.render,
});

/** A different composition: the fallback only, used when no image source resolves. */
export const FallbackOnly = meta.story({
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
});

/** A different composition: a status indicator overlaid on the avatar. */
export const WithBadge = meta.story({
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage alt="@codefast" className="grayscale" src="https://github.com/codefastlabs.png" />
      <AvatarFallback>CN</AvatarFallback>
      <AvatarBadge className="bg-green-600 dark:bg-green-800" />
    </Avatar>
  ),
});

/** A different composition: many avatars stacked with an overflow count. */
export const Group = meta.story({
  parameters: { controls: { disable: true } },
  render: () => (
    <AvatarGroup className="grayscale">
      <Avatar>
        <AvatarImage alt="@codefast" src="https://github.com/codefastlabs.png" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage alt="@leo" src="https://avatar.vercel.sh/leo" />
        <AvatarFallback>LR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage alt="@ava" src="https://avatar.vercel.sh/ava" />
        <AvatarFallback>ER</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  ),
});
