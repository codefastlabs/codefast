import { expect } from "storybook/test";

import { Button } from "#/components/button";
import { DirectionProvider } from "#/components/direction";

import preview from "../.storybook/preview";

/**
 * DirectionProvider — a Radix CONTEXT PROVIDER that sets the reading direction
 * (LTR/RTL) for all descendant components. It renders NO DOM of its own, so
 * Storybook cannot infer args from `component` and would resolve them to
 * `never`; we use the flat-args workaround (a custom `DirectionArgs` shape +
 * `subcomponents` for docgen) and narrow on `args` inside `render`.
 *
 * Content here is authored for Storybook against the component's own public
 * API — it is NOT synced with the apps/web registry.
 *
 * **Anatomy:** `DirectionProvider > (any direction-aware subtree)`.
 */
interface DirectionArgs {
  dir: "ltr" | "rtl";
}

const meta = preview.type<{ args: DirectionArgs }>().meta({
  args: { dir: "ltr" },
  argTypes: {
    dir: { control: "radio", options: ["ltr", "rtl"] },
  },
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
  subcomponents: { DirectionProvider },
  title: "Layout/Direction",
});

export const Default = meta.story({
  render: ({ dir }) => {
    const isRtl = dir === "rtl";

    return (
      <DirectionProvider dir={dir}>
        <div dir={dir} className="flex w-full max-w-sm items-center gap-2 rounded-md border p-4">
          <Button size="sm">{isRtl ? "حفظ" : "Save"}</Button>
          <Button size="sm" variant="outline">
            {isRtl ? "إلغاء" : "Cancel"}
          </Button>
          <span className="ms-auto text-sm text-muted-foreground">{dir.toUpperCase()}</span>
        </div>
      </DirectionProvider>
    );
  },
});

export const RightToLeft = meta.story({
  args: { dir: "rtl" },
  render: Default.input.render,
});

RightToLeft.test("applies the dir attribute so the subtree mirrors", async ({ canvas }) => {
  // Buttons stay in source order; the `dir="rtl"` wrapper flips visual layout.
  const save = await canvas.findByText("حفظ");

  await expect(save.closest("[dir]")).toHaveAttribute("dir", "rtl");
});
