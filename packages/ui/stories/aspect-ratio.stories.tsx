import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayIcon } from "lucide-react";

import { AspectRatio } from "#/components/aspect-ratio";

/**
 * AspectRatio's root requires a `ratio` prop, so it's demoed via `render`
 * rather than bound to `component` (Pattern B, see Accordion).
 */
const meta = {
  title: "Display/AspectRatio",
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <div className="overflow-hidden rounded-xl border">
        <AspectRatio ratio={16 / 9}>
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/80 to-violet-500">
            <span className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <PlayIcon className="size-5 fill-white text-white" />
            </span>
          </div>
        </AspectRatio>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Product walkthrough · 16:9</p>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div className="w-full max-w-48">
      <AspectRatio ratio={1 / 1} className="rounded-lg bg-muted">
        <img
          src="https://avatar.vercel.sh/codefast"
          alt="Codefast avatar"
          className="size-full rounded-lg object-cover grayscale dark:brightness-20"
        />
      </AspectRatio>
    </div>
  ),
};

export const Portrait: Story = {
  render: () => (
    <div className="w-full max-w-40">
      <AspectRatio ratio={9 / 16} className="rounded-lg bg-muted">
        <img
          src="https://avatar.vercel.sh/codefast"
          alt="Codefast avatar"
          className="size-full rounded-lg object-cover grayscale dark:brightness-20"
        />
      </AspectRatio>
    </div>
  ),
};
