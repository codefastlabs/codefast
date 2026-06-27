import { InboxIcon } from "lucide-react";
import { expect } from "storybook/test";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/avatar";
import { Button } from "#/components/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "#/components/empty";

import preview from "../.storybook/preview";

/**
 * Empty — a layout-only COMPOSITE. The root (`Empty`) is a plain `<div>` with no
 * enum/boolean/number props of its own, so it has no Controls; the only variant
 * (`default` · `icon`) lives on the `EmptyMedia` subcomponent and is surfaced as a
 * flat `mediaVariant` arg here. Content is authored for Storybook, NOT synced with
 * the apps/web registry.
 */
interface EmptyArgs {
  mediaVariant: "default" | "icon";
}

const meta = preview.type<{ args: EmptyArgs }>().meta({
  args: {
    mediaVariant: "icon",
  },
  argTypes: {
    mediaVariant: { control: "radio", options: ["default", "icon"] },
  },
  parameters: {
    docs: {
      description: {
        component: [
          "A placeholder shown when there is no data, guiding the user toward a next action.",
          "",
          "**Anatomy:** `Empty > (EmptyHeader (EmptyMedia · EmptyTitle · EmptyDescription) + EmptyContent)`.",
          "`EmptyMedia` takes a `variant` (`default` · `icon`) to frame an illustration or icon; put the call-to-action in `EmptyContent`.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent },
  title: "Display/Empty",
});

export const Default = meta.story({
  render: ({ mediaVariant }) => (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant={mediaVariant}>
          <InboxIcon className={mediaVariant === "default" ? "size-10 text-muted-foreground" : undefined} />
        </EmptyMedia>
        <EmptyTitle>No messages yet</EmptyTitle>
        <EmptyDescription>When you receive messages, they will appear here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Compose message</Button>
      </EmptyContent>
    </Empty>
  ),
});

export const PlainMedia = meta.story({
  args: { mediaVariant: "default" },
  render: Default.input.render,
});

/**
 * A genuinely different composition: an avatar fills the media slot instead of an
 * icon, so this story has its own render rather than reusing the base.
 */
export const WithAvatar = meta.story({
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="default">
          <Avatar className="size-12">
            <AvatarImage src="https://github.com/codefastlabs.png" className="grayscale" />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
        </EmptyMedia>
        <EmptyTitle>User Offline</EmptyTitle>
        <EmptyDescription>
          This user is currently offline. You can leave a message to notify them or try again later.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Leave Message</Button>
      </EmptyContent>
    </Empty>
  ),
});

Default.test("media slot reflects the icon variant contract", async ({ canvas }) => {
  await expect(canvas.getByText("No messages yet")).toBeInTheDocument();
  const media = canvas
    .getByText("No messages yet")
    .closest("[data-slot='empty-header']")
    ?.querySelector("[data-slot='empty-icon']");
  await expect(media).toHaveAttribute("data-variant", "icon");
});

PlainMedia.test("media slot reflects the default variant contract", async ({ canvas }) => {
  const media = canvas
    .getByText("No messages yet")
    .closest("[data-slot='empty-header']")
    ?.querySelector("[data-slot='empty-icon']");
  await expect(media).toHaveAttribute("data-variant", "default");
});
