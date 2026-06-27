import { expect, fn } from "storybook/test";

import { CheckboxCards, CheckboxCardsItem } from "#/components/checkbox-cards";

import preview from "../.storybook/preview";

const FEATURES = [
  { value: "analytics", label: "Analytics", description: "Track usage and insights" },
  { value: "notifications", label: "Notifications", description: "Email and push alerts" },
  { value: "api", label: "API Access", description: "Integrate with external tools" },
];

/**
 * CheckboxCards — a COMPOSITE multi-select group rendered as large clickable card
 * surfaces instead of bare checkboxes. The root `CheckboxCards` is a normal component
 * (a checkbox-group provider) that owns real props — `orientation`, `loop`, `disabled`,
 * `defaultValue`/`value` (arrays) + `onValueChange` — so it drives Controls directly.
 * Content here is authored against the component's own public API for Storybook and is
 * NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { defaultValue: [], disabled: false, loop: true, orientation: "vertical" },
  argTypes: {
    defaultValue: { table: { disable: true } },
    disabled: { control: "boolean" },
    loop: { control: "boolean" },
    onValueChange: { table: { disable: true } },
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
    required: { control: "boolean" },
    value: { table: { disable: true } },
  },
  component: CheckboxCards,
  parameters: {
    controls: { include: ["orientation", "loop", "disabled", "required"] },
    docs: {
      description: {
        component: [
          "A multi-select group rendered as large, clickable cards instead of plain checkboxes.",
          "",
          "**Anatomy:** `CheckboxCards > CheckboxCardsItem`.",
          "Drive it with `value`/`defaultValue` (an array) + `onValueChange`; each item is a selectable card surface.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { CheckboxCardsItem },
  title: "Form/CheckboxCards",
});

export const Default = meta.story({
  render: (args) => (
    <CheckboxCards {...args} className="grid w-full max-w-xs gap-2">
      {FEATURES.map(({ value, label, description }) => (
        <CheckboxCardsItem key={value} value={value}>
          <div className="flex flex-col gap-0.5 text-start">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        </CheckboxCardsItem>
      ))}
    </CheckboxCards>
  ),
});

export const Preselected = meta.story({
  args: { defaultValue: ["analytics", "api"] },
  render: Default.input.render,
});

export const Disabled = meta.story({
  args: { disabled: true, defaultValue: ["notifications"] },
  render: Default.input.render,
});

export const Horizontal = meta.story({
  args: { orientation: "horizontal" },
  render: Default.input.render,
});

export const SelectsOnClick = meta.story({
  args: { onValueChange: fn() },
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
SelectsOnClick.test("toggles selection and reports the new value", async ({ args, canvas, userEvent }) => {
  const checkbox = canvas.getByRole("checkbox", { name: /analytics/i });

  await expect(checkbox).not.toBeChecked();

  await userEvent.click(checkbox);

  await expect(checkbox).toBeChecked();
  await expect(args.onValueChange).toHaveBeenCalled();
  await expect(args.onValueChange).toHaveBeenLastCalledWith(["analytics"]);
});
