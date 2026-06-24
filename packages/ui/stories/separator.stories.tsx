import { Separator } from "#/components/separator";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: Separator,
  title: "Layout/Separator",
});

export const Default = meta.story({
  render: () => (
    <div className="w-full max-w-xs">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">@codefast/ui</p>
        <p className="text-xs text-muted-foreground">Open-source React components.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Blog</span>
        <Separator orientation="vertical" className="h-3" />
        <span>Docs</span>
        <Separator orientation="vertical" className="h-3" />
        <span>Source</span>
      </div>
    </div>
  ),
});

export const Vertical = meta.story({
  render: () => (
    <div className="flex h-5 items-center gap-4 text-sm">
      <div>Blog</div>
      <Separator orientation="vertical" />
      <div>Docs</div>
      <Separator orientation="vertical" />
      <div>Source</div>
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
