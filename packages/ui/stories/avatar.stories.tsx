import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "#/components/avatar";

import preview from "../.storybook/preview";

/**
 * Avatar is a composition with optional root props. Demoed via `render` while
 * keeping `component` bound to the Root (Pattern C, see Card).
 */
const meta = preview.meta({
  component: Avatar,
  title: "Display/Avatar",
});

export const Default = meta.story({
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" className="grayscale" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
});

export const Sizes = meta.story({
  render: () => (
    <div className="flex flex-wrap items-center gap-2 grayscale">
      <Avatar size="sm">
        <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    </div>
  ),
});

export const WithBadge = meta.story({
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" />
      <AvatarFallback>CN</AvatarFallback>
      <AvatarBadge className="bg-green-600 dark:bg-green-800" />
    </Avatar>
  ),
});

export const Group = meta.story({
  render: () => (
    <AvatarGroup className="grayscale">
      <Avatar>
        <AvatarImage src="https://github.com/codefastlabs.png" alt="@codefast" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://avatar.vercel.sh/leo" alt="@leo" />
        <AvatarFallback>LR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://avatar.vercel.sh/ava" alt="@ava" />
        <AvatarFallback>ER</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  ),
});
