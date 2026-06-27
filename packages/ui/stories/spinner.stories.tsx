import { Button } from "#/components/button";
import { Spinner } from "#/components/spinner";

import preview from "../.storybook/preview";

/**
 * Spinner — a prop-driven display leaf. The root is a `<span>` whose only own prop
 * is `loading`; when `false` it renders its children instead of the animated dots,
 * which makes it a drop-in wrapper for loading regions. All other attributes
 * forward to the host span. Content here is authored against the component's own
 * public API for Storybook, NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { loading: true },
  argTypes: {
    loading: { control: "boolean" },
  },
  component: Spinner,
  parameters: {
    controls: { include: ["loading"] },
    docs: {
      description: {
        component:
          "An indeterminate loading indicator built from eight fading dots. Honors `prefers-reduced-motion`. With `loading={false}` it renders its `children` unchanged, so it can wrap content and swap to a spinner in place.",
      },
    },
  },
  title: "Display/Spinner",
});

export const Default = meta.story({
  render: (args) => (
    <div className="flex w-full max-w-xs items-center justify-center">
      <Spinner className="size-8" {...args} />
    </div>
  ),
});

/** `loading={false}` short-circuits to the children (here, nothing) — the dots disappear. */
export const NotLoading = meta.story({
  args: { loading: false },
  render: Default.input.render,
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

export const InContext = meta.story({
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
