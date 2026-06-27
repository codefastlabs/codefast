import { Card, CardContent, CardHeader } from "#/components/card";
import { Skeleton } from "#/components/skeleton";

import preview from "../.storybook/preview";

/**
 * Skeleton — a LAYOUT-ONLY placeholder. The root is just a styled `<div>`
 * (`ComponentProps<"div">`) with a shimmer animation: it owns no enum/boolean/number
 * prop, so it correctly has no Controls — shape and size are expressed purely through
 * `className`. Each story below is a genuinely different composition (card, text block,
 * avatar row, media card), so they keep their own render. Content is authored for
 * Storybook, not synced with the apps/web registry.
 */
const meta = preview.meta({
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component:
          "Animated placeholder shown while content loads. It is a styled `<div>` with no props of its own — compose its width/height/shape via `className` and arrange several to mirror the eventual layout.",
      },
    },
  },
  title: "Feedback/Skeleton",
});

export const Default = meta.story({
  render: () => (
    <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
      {[0, 1].map((index) => (
        <div key={index} className="rounded-xl bg-card p-3 shadow-sm ring-1 ring-border">
          <Skeleton className="mb-3 h-24 w-full rounded-lg" />
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="size-7 shrink-0 rounded-full" />
            <Skeleton className="h-2.5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-2 w-3/4 rounded-full" />
          <Skeleton className="mt-1.5 h-2 w-1/2 rounded-full" />
        </div>
      ))}
    </div>
  ),
});

export const Text = meta.story({
  render: () => (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  ),
});

export const AvatarWithText = meta.story({
  render: () => (
    <div className="flex w-fit items-center gap-4">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-37.5" />
        <Skeleton className="h-4 w-25" />
      </div>
    </div>
  ),
});

export const CardLayout = meta.story({
  render: () => (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full" />
      </CardContent>
    </Card>
  ),
});
