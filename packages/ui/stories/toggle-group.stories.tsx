import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { expect } from "storybook/test";

import { ToggleGroup, ToggleGroupItem } from "#/components/toggle-group";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: ToggleGroup,
  subcomponents: { ToggleGroupItem },
  parameters: {
    docs: {
      description: {
        component: [
          "A set of two-state buttons that can be toggled on or off, individually or exclusively.",
          "",
          "**Anatomy:** `ToggleGroup > ToggleGroupItem`.",
          'Set `type="single"` (one active) or `type="multiple"` (many active); each item needs a `value`.',
        ].join("\n"),
      },
    },
  },
  title: "Form/ToggleGroup",
});

export const Default = meta.story({
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <ToggleGroup type="single" defaultValue="left">
        <ToggleGroupItem aria-label="Align left" value="left">
          <AlignLeftIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Align center" value="center">
          <AlignCenterIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Align right" value="right">
          <AlignRightIcon />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="multiple">
        <ToggleGroupItem aria-label="Bold" value="bold">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Italic" value="italic">
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Underline" value="underline">
          <UnderlineIcon />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
});

export const Outline = meta.story({
  render: () => (
    <ToggleGroup variant="outline" type="single" defaultValue="all">
      <ToggleGroupItem value="all" aria-label="Toggle all">
        All
      </ToggleGroupItem>
      <ToggleGroupItem value="missed" aria-label="Toggle missed">
        Missed
      </ToggleGroupItem>
    </ToggleGroup>
  ),
});

export const Vertical = meta.story({
  render: () => (
    <ToggleGroup type="multiple" orientation="vertical" spacing={1} defaultValue={["bold", "italic"]}>
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <UnderlineIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
});

export const Sizes = meta.story({
  render: () => (
    <div className="flex flex-col gap-4">
      <ToggleGroup type="single" size="sm" defaultValue="top" variant="outline">
        <ToggleGroupItem value="top" aria-label="Toggle top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
          Bottom
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" defaultValue="top" variant="outline">
        <ToggleGroupItem value="top" aria-label="Toggle top">
          Top
        </ToggleGroupItem>
        <ToggleGroupItem value="bottom" aria-label="Toggle bottom">
          Bottom
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
});

export const SelectsOnClick = meta.story({
  render: () => (
    <ToggleGroup type="single">
      <ToggleGroupItem aria-label="Align left" value="left">
        <AlignLeftIcon />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Align center" value="center">
        <AlignCenterIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
SelectsOnClick.test("selects on click", async ({ canvas, userEvent }) => {
  const item = canvas.getByRole("radio", { name: "Align left" });

  await userEvent.click(item);
  await expect(item).toHaveAttribute("aria-checked", "true");
});
