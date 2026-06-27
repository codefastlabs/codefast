import { PlayIcon } from "lucide-react";

import { AspectRatio } from "#/components/aspect-ratio";

import preview from "../.storybook/preview";

/**
 * AspectRatio — a LAYOUT-ONLY wrapper that constrains its content to a desired
 * width/height ratio. Its only meaningful root prop is `ratio` (a number), so it
 * has a single number Control and no enum/boolean knobs. Content here is authored
 * for Storybook and is NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { ratio: 1 / 1 },
  argTypes: { ratio: { control: "number" } },
  component: AspectRatio,
  parameters: {
    docs: {
      description: {
        component:
          "Constrains content (image, video, embed) to a fixed `ratio` regardless of width.\n\n**Anatomy:** `AspectRatio` wraps a single child that fills the reserved box.",
      },
    },
  },
  title: "Display/AspectRatio",
});

/**
 * Featured composition: a 16:9 video placeholder with a caption — a distinct
 * composition from the image stories below, so it owns its own render.
 */
export const Default = meta.story({
  args: { ratio: 16 / 9 },
  render: (args) => (
    <div className="w-full max-w-sm">
      <div className="overflow-hidden rounded-xl border border-border">
        <AspectRatio {...args}>
          <div className="flex size-full items-center justify-center bg-primary/80">
            <span className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <PlayIcon className="size-5 fill-white text-white" />
            </span>
          </div>
        </AspectRatio>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Product walkthrough · 16:9</p>
    </div>
  ),
});

/**
 * Image composition driven by `ratio`. Square and Portrait below differ ONLY by
 * args and reuse this single render.
 */
export const Square = meta.story({
  render: (args) => (
    <div className="w-full max-w-48">
      <AspectRatio {...args} className="rounded-lg bg-muted">
        <img
          src="https://avatar.vercel.sh/codefast"
          alt="Codefast avatar"
          className="size-full rounded-lg object-cover grayscale dark:brightness-20"
        />
      </AspectRatio>
    </div>
  ),
});

export const Portrait = meta.story({
  args: { ratio: 9 / 16 },
  render: Square.input.render,
});
