import { Button } from "#/components/button";
import { DirectionProvider } from "#/components/direction";

import preview from "../.storybook/preview";

/**
 * DirectionProvider sets the reading direction (LTR/RTL) for descendant
 * components via Radix. It has no visual output of its own, so it's demoed via
 * `render` wrapping sample content (see Accordion).
 */
const meta = preview.meta({
  title: "Layout/Direction",
});

export const Default = meta.story({
  render: () => (
    <DirectionProvider dir="ltr">
      <div dir="ltr" className="flex w-full max-w-sm items-center gap-2 rounded-md border p-4">
        <Button size="sm">Save</Button>
        <Button size="sm" variant="outline">
          Cancel
        </Button>
        <span className="ms-auto text-sm text-muted-foreground">LTR</span>
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
