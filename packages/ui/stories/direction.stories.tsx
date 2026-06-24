import { Button } from "#/components/button";
import { DirectionProvider } from "#/components/direction";

import preview from "../.storybook/preview";

/**
 * DirectionProvider sets the reading direction (LTR/RTL) for descendant
 * components via Radix. It has no visual output of its own, so each story wraps
 * sample content in `render`.
 */
/**
 * DirectionProvider is a Radix context provider with no DOM of its own, so
 * Storybook can't infer its args from `component`. Expose a flat custom args
 * shape and document the provider via `subcomponents`.
 */
interface DirectionArgs {
  dir: "ltr" | "rtl";
}

const meta = preview.type<{ args: DirectionArgs }>().meta({
  args: { dir: "ltr" },
  argTypes: {
    dir: { control: "radio", options: ["ltr", "rtl"] },
  },
  subcomponents: { DirectionProvider },
  parameters: {
    docs: {
      description: {
        component: [
          "A context provider that sets the reading direction (LTR/RTL) for all descendant Radix components.",
          "",
          "Renders no DOM of its own; wrap a subtree and set `dir` so popovers, menus, and sliders mirror correctly.",
        ].join("\n"),
      },
    },
  },
  title: "Layout/Direction",
});

export const Default = meta.story({
  render: ({ dir }) => (
    <DirectionProvider dir={dir}>
      <div dir={dir} className="flex w-full max-w-sm items-center gap-2 rounded-md border p-4">
        <Button size="sm">Save</Button>
        <Button size="sm" variant="outline">
          Cancel
        </Button>
        <span className="ms-auto text-sm text-muted-foreground">{dir.toUpperCase()}</span>
      </div>
    </DirectionProvider>
  ),
});

export const RightToLeft = meta.story({
  render: () => (
    <DirectionProvider dir="rtl">
      <div dir="rtl" className="flex w-full max-w-sm items-center gap-2 rounded-md border p-4">
        <Button size="sm">حفظ</Button>
        <Button size="sm" variant="outline">
          إلغاء
        </Button>
        <span className="ms-auto text-sm text-muted-foreground">RTL</span>
      </div>
    </DirectionProvider>
  ),
});
