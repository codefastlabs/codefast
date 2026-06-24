import { Button } from "#/components/button";
import { Spinner } from "#/components/spinner";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: Spinner,
  title: "Display/Spinner",
});

export const Default = meta.story({
  render: () => (
    <div className="flex w-full max-w-xs flex-col items-center gap-4">
      <Button disabled>
        <Spinner className="size-4" />
        Saving changes…
      </Button>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        Fetching your data
      </div>
    </div>
  ),
});

export const Sizes = meta.story({
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner className="size-3" />
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  ),
});

export const InButton = meta.story({
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <Button disabled size="sm">
        <Spinner data-icon="inline-start" />
        Loading...
      </Button>
      <Button variant="outline" disabled size="sm">
        <Spinner data-icon="inline-start" />
        Please wait
      </Button>
      <Button variant="secondary" disabled size="sm">
        <Spinner data-icon="inline-start" />
        Processing
      </Button>
    </div>
  ),
});
