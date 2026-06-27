import { Separator, SeparatorItem } from "#/components/separator";

import preview from "../.storybook/preview";

/**
 * Separator — a prop-driven leaf. The root owns every interesting prop
 * (`orientation`, `align`, `decorative`), so `{...args}` drives it directly and
 * variant stories differ only by `args`, reusing the base render. The optional
 * `SeparatorItem` floats a label over the line. Content is authored for
 * Storybook, independent of the apps/web registry.
 */
const meta = preview.meta({
  args: { align: "center", decorative: true, orientation: "horizontal" },
  argTypes: {
    align: { control: "radio", options: ["start", "center", "end"] },
    decorative: { control: "boolean" },
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
  },
  component: Separator,
  parameters: {
    controls: { include: ["orientation", "align", "decorative"] },
    docs: {
      description: {
        component: [
          "A thin rule that visually or semantically divides content.",
          "",
          "**Anatomy:** `Separator` standalone, or `Separator + SeparatorItem` to float a label over the line.",
          "Choose `orientation` (`horizontal` · `vertical`) and `align`; `decorative` defaults to `true` so it is hidden from assistive tech.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { SeparatorItem },
  title: "Layout/Separator",
});

export const Default = meta.story({
  render: (args) => (
    <div className="flex h-24 w-full max-w-xs items-center justify-center">
      <Separator {...args} />
    </div>
  ),
});

export const Vertical = meta.story({
  args: { orientation: "vertical" },
  render: Default.input.render,
});

export const Semantic = meta.story({
  args: { decorative: false },
  render: Default.input.render,
});

export const Showcase = meta.story({
  render: () => (
    <div className="w-full max-w-xs">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">@codefast/ui</p>
        <p className="text-xs text-muted-foreground">Open-source React components.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Blog</span>
        <Separator className="h-3" orientation="vertical" />
        <span>Docs</span>
        <Separator className="h-3" orientation="vertical" />
        <span>Source</span>
      </div>
    </div>
  ),
});

export const WithLabel = meta.story({
  render: () => (
    <div className="w-full max-w-xs">
      <Separator>
        <SeparatorItem>or continue with</SeparatorItem>
      </Separator>
    </div>
  ),
});

export const List = meta.story({
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-2 text-sm">
      <dl className="flex items-center justify-between">
        <dt>Item 1</dt>
        <dd className="text-muted-foreground">Value 1</dd>
      </dl>
      <Separator />
      <dl className="flex items-center justify-between">
        <dt>Item 2</dt>
        <dd className="text-muted-foreground">Value 2</dd>
      </dl>
      <Separator />
      <dl className="flex items-center justify-between">
        <dt>Item 3</dt>
        <dd className="text-muted-foreground">Value 3</dd>
      </dl>
    </div>
  ),
});
