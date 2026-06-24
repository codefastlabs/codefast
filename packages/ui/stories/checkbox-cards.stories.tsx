import { useState } from "react";
import { expect } from "storybook/test";

import { CheckboxCards, CheckboxCardsItem } from "#/components/checkbox-cards";

import preview from "../.storybook/preview";

const FEATURES = [
  {
    value: "analytics",
    label: "Analytics",
    description: "Track usage and insights",
  },
  {
    value: "notifications",
    label: "Notifications",
    description: "Email and push alerts",
  },
  {
    value: "api",
    label: "API Access",
    description: "Integrate with external tools",
  },
];

const ADDONS = [
  { value: "ci", label: "CI minutes" },
  { value: "seats", label: "Extra seats" },
  { value: "storage", label: "More storage" },
  { value: "support", label: "Priority support" },
];

const PLANS = [
  {
    value: "free",
    label: "Free",
    description: "Up to 3 projects",
    disabled: false,
  },
  {
    value: "pro",
    label: "Pro",
    description: "Unlimited projects",
    disabled: false,
  },
  {
    value: "enterprise",
    label: "Enterprise",
    description: "Contact sales",
    disabled: true,
  },
];

/**
 * CheckboxCards is a composition with a multi-select value array driven by
 * `onValueChange`, so stories are demoed via `render` (see Accordion).
 */
const meta = preview.meta({
  title: "Form/CheckboxCards",
});

export const Default = meta.story({
  render: () => {
    function Render() {
      const [selected, setSelected] = useState<Array<string>>(["analytics"]);

      return (
        <CheckboxCards
          className="grid w-full max-w-xs gap-2"
          value={selected}
          onValueChange={(value) => {
            setSelected(value ?? []);
          }}
        >
          {FEATURES.map(({ value, label, description }) => (
            <CheckboxCardsItem key={value} value={value}>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
            </CheckboxCardsItem>
          ))}
        </CheckboxCards>
      );
    }

    return <Render />;
  },
});

export const Columns = meta.story({
  render: () => {
    function Render() {
      const [selected, setSelected] = useState<Array<string>>(["ci", "storage"]);

      return (
        <CheckboxCards
          className="grid w-full max-w-sm grid-cols-2 gap-2"
          value={selected}
          onValueChange={(value) => setSelected(value ?? [])}
        >
          {ADDONS.map(({ value, label }) => (
            <CheckboxCardsItem key={value} value={value}>
              <span className="text-sm font-medium">{label}</span>
            </CheckboxCardsItem>
          ))}
        </CheckboxCards>
      );
    }

    return <Render />;
  },
});

export const Disabled = meta.story({
  render: () => {
    function Render() {
      const [selected, setSelected] = useState<Array<string>>(["pro"]);

      return (
        <CheckboxCards
          className="grid w-full max-w-xs gap-2"
          value={selected}
          onValueChange={(value) => setSelected(value ?? [])}
        >
          {PLANS.map(({ value, label, description, disabled }) => (
            <CheckboxCardsItem key={value} value={value} {...(disabled ? { disabled } : {})}>
              <div className="flex flex-col gap-0.5 text-start">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
            </CheckboxCardsItem>
          ))}
        </CheckboxCards>
      );
    }

    return <Render />;
  },
});

export const SelectsOnClick = meta.story({
  render: () => (
    <CheckboxCards className="grid w-full max-w-xs gap-2">
      {FEATURES.map(({ value, label }) => (
        <CheckboxCardsItem key={value} value={value}>
          <span className="text-sm font-medium">{label}</span>
        </CheckboxCardsItem>
      ))}
    </CheckboxCards>
  ),
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
SelectsOnClick.test("selects on click", async ({ canvas, userEvent }) => {
  const checkbox = canvas.getByRole("checkbox", { name: /analytics/i });

  await userEvent.click(checkbox);
  await expect(checkbox).toBeChecked();
});
