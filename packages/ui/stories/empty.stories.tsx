import { CloudIcon, InboxIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/avatar";
import { Button } from "#/components/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "#/components/empty";

import preview from "../.storybook/preview";

/**
 * Empty is a composition with optional root props. Demoed via `render` while
 * keeping `component` bound to the Root (Pattern C, see Card).
 */
const meta = preview.meta({
  component: Empty,
  title: "Display/Empty",
});

export const Default = meta.story({
  render: () => (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia>
          <InboxIcon className="size-10 text-muted-foreground" />
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

export const Outline = meta.story({
  render: () => (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CloudIcon />
        </EmptyMedia>
        <EmptyTitle>Cloud Storage Empty</EmptyTitle>
        <EmptyDescription>Upload files to your cloud storage to access them anywhere.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          Upload Files
        </Button>
      </EmptyContent>
    </Empty>
  ),
});

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
