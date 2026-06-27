import { CreditCardIcon, LandmarkIcon, WalletIcon } from "lucide-react";
import { useState } from "react";
import { expect, fn } from "storybook/test";

import { Badge } from "#/components/badge";
import { RadioCards, RadioCardsItem } from "#/components/radio-cards";

import preview from "../.storybook/preview";

const PLANS = [
  { value: "free", label: "Free", price: "$0 / mo", description: "For personal projects" },
  { value: "pro", label: "Pro", price: "$12 / mo", description: "For professional use" },
  { value: "team", label: "Team", price: "$49 / mo", description: "For growing teams" },
];

const METHODS = [
  { value: "card", label: "Card", icon: CreditCardIcon },
  { value: "wallet", label: "Wallet", icon: WalletIcon },
  { value: "bank", label: "Bank", icon: LandmarkIcon },
];

/**
 * RadioCards — a prop-driven COMPOSITE single-select group built on Radix RadioGroup,
 * rendered as large clickable card surfaces instead of bare radios. The root owns the
 * interesting props (orientation, loop, disabled, value/defaultValue); each card is a
 * `RadioCardsItem`. Content here is authored for Storybook against the component's own
 * public API — it is NOT synced with or copied from the apps/web registry.
 */
const meta = preview.meta({
  args: { defaultValue: "free", disabled: false, loop: true, orientation: "vertical" },
  argTypes: {
    asChild: { table: { disable: true } },
    defaultValue: { control: "text" },
    disabled: { control: "boolean" },
    loop: { control: "boolean" },
    onValueChange: { table: { disable: true } },
    orientation: { control: "radio", options: ["horizontal", "vertical"] },
    value: { table: { disable: true } },
  },
  component: RadioCards,
  parameters: {
    controls: { include: ["defaultValue", "disabled", "loop", "orientation"] },
    docs: {
      description: {
        component: [
          "A single-select group rendered as large, clickable cards instead of plain radios.",
          "",
          "**Anatomy:** `RadioCards > RadioCardsItem`.",
          "Drive it with `value`/`defaultValue` + `onValueChange`; each item is a selectable card surface.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { RadioCardsItem },
  title: "Form/RadioCards",
});

export const Default = meta.story({
  render: (args) => (
    <RadioCards {...args} className="grid w-full max-w-xs gap-2">
      {PLANS.map(({ value, label, price, description }) => (
        <RadioCardsItem key={value} value={value}>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {label} — {price}
            </span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        </RadioCardsItem>
      ))}
    </RadioCards>
  ),
});

export const Disabled = meta.story({ args: { disabled: true }, render: Default.input.render });

/** A genuinely different composition: a two-column controlled grid for a billing interval. */
export const Interval = meta.story({
  render: () => {
    function Render() {
      const [interval, setInterval] = useState("yearly");

      return (
        <RadioCards className="grid w-full max-w-sm grid-cols-2 gap-2" value={interval} onValueChange={setInterval}>
          <RadioCardsItem value="monthly">
            <div className="flex flex-col gap-0.5 text-start">
              <span className="text-sm font-medium">Monthly</span>
              <span className="text-xs text-muted-foreground">$12 billed each month</span>
            </div>
          </RadioCardsItem>
          <RadioCardsItem value="yearly">
            <div className="flex flex-col gap-0.5 text-start">
              <span className="flex items-center gap-2 text-sm font-medium">
                Yearly
                <Badge variant="secondary">−20%</Badge>
              </span>
              <span className="text-xs text-muted-foreground">$115 billed once a year</span>
            </div>
          </RadioCardsItem>
        </RadioCards>
      );
    }

    return <Render />;
  },
});

/** A genuinely different composition: a compact three-column icon grid for a payment method. */
export const Payment = meta.story({
  render: () => {
    function Render() {
      const [method, setMethod] = useState("card");

      return (
        <RadioCards className="grid w-full max-w-sm grid-cols-3 gap-2" value={method} onValueChange={setMethod}>
          {METHODS.map(({ value, label, icon: Icon }) => (
            <RadioCardsItem key={value} value={value}>
              <div className="flex flex-col items-center gap-1.5">
                <Icon className="size-5" />
                <span className="text-xs font-medium">{label}</span>
              </div>
            </RadioCardsItem>
          ))}
        </RadioCards>
      );
    }

    return <Render />;
  },
});

export const SelectsOnClick = meta.story({
  args: { defaultValue: undefined, onValueChange: fn() },
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
SelectsOnClick.test("checks the clicked card and fires onValueChange", async ({ args, canvas, userEvent }) => {
  const team = canvas.getByRole("radio", { name: /Team/ });

  await expect(team).not.toBeChecked();
  await userEvent.click(team);
  await expect(team).toBeChecked();
  await expect(args.onValueChange).toHaveBeenCalledWith("team");
});
