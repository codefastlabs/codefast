import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { expect } from "storybook/test";

import { ToggleGroup, ToggleGroupItem } from "#/components/toggle-group";

import preview from "../.storybook/preview";

/**
 * ToggleGroup's root prop type is a discriminated union (`type: "single" | "multiple"`),
 * which CSF Next can't drive via `{...args}`. We expose a flat custom args shape and
 * narrow on `type` in the render so the Controls panel gets type/variant/size/etc.
 */
interface ToggleGroupArgs {
  disabled: boolean;
  orientation: "horizontal" | "vertical";
  size: "default" | "lg" | "sm";
  type: "multiple" | "single";
  variant: "default" | "outline";
}

const meta = preview.type<{ args: ToggleGroupArgs }>().meta({
  args: { disabled: false, orientation: "horizontal", size: "default", type: "single", variant: "default" },
  argTypes: {
    disabled: { control: "boolean" },
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
    size: { control: "radio", options: ["default", "sm", "lg"] },
    type: { control: "radio", options: ["single", "multiple"] },
    variant: { control: "radio", options: ["default", "outline"] },
  },
  subcomponents: { ToggleGroup, ToggleGroupItem },
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
  render: ({ disabled, orientation, size, type, variant }) => {
    const items = (
      <>
        <ToggleGroupItem aria-label="Align left" value="left">
          <AlignLeftIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Align center" value="center">
          <AlignCenterIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Align right" value="right">
          <AlignRightIcon />
        </ToggleGroupItem>
      </>
    );

    return type === "multiple" ? (
      <ToggleGroup disabled={disabled} orientation={orientation} size={size} type="multiple" variant={variant}>
        {items}
      </ToggleGroup>
    ) : (
      <ToggleGroup
        defaultValue="left"
        disabled={disabled}
        orientation={orientation}
        size={size}
        type="single"
        variant={variant}
      >
        {items}
      </ToggleGroup>
    );
  },
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
