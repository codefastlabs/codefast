import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from "lucide-react";
import { expect } from "storybook/test";

import { ToggleGroup, ToggleGroupItem } from "#/components/toggle-group";

import preview from "../.storybook/preview";

/**
 * ToggleGroup is a COMPOSITE whose root prop type is a discriminated union
 * (`type: "single" | "multiple"`), which CSF Next can't drive via `{...args}`.
 * We expose a flat custom args shape and narrow on `type` in the render so the
 * Controls panel gets type/variant/size/etc. Content is authored for Storybook,
 * NOT synced with the apps/web registry.
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
  subcomponents: { ToggleGroup, ToggleGroupItem },
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

/** Many items can be active at once. Reuses the base render, only `args` differ. */
export const Multiple = meta.story({ args: { type: "multiple" }, render: Default.input.render });

/** Bordered buttons. Reuses the base render, only `args` differ. */
export const Outline = meta.story({ args: { variant: "outline" }, render: Default.input.render });

/** Stacked vertically. Reuses the base render, only `args` differ. */
export const Vertical = meta.story({
  args: { orientation: "vertical", type: "multiple" },
  render: Default.input.render,
});

/** Smaller hit targets. Reuses the base render, only `args` differ. */
export const Small = meta.story({ args: { size: "sm", variant: "outline" }, render: Default.input.render });

/** Whole group disabled. Reuses the base render, only `args` differ. */
export const Disabled = meta.story({ args: { disabled: true }, render: Default.input.render });

export const SelectsOnClick = meta.story({ render: Default.input.render });

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
SelectsOnClick.test("single mode moves the active item on click", async ({ canvas, userEvent }) => {
  const left = canvas.getByRole("radio", { name: "Align left" });
  const center = canvas.getByRole("radio", { name: "Align center" });

  // Default render seeds `defaultValue="left"`.
  await expect(left).toHaveAttribute("aria-checked", "true");

  await userEvent.click(center);
  await expect(center).toHaveAttribute("aria-checked", "true");
  await expect(left).toHaveAttribute("aria-checked", "false");
});
