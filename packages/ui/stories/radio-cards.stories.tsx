import { CreditCardIcon, LandmarkIcon, WalletIcon } from "lucide-react";
import { useState } from "react";
import { expect } from "storybook/test";

import { Badge } from "#/components/badge";
import { RadioCards, RadioCardsItem } from "#/components/radio-cards";

import preview from "../.storybook/preview";

const PLANS = [
  {
    value: "free",
    label: "Free",
    price: "$0 / mo",
    description: "For personal projects",
  },
  {
    value: "pro",
    label: "Pro",
    price: "$12 / mo",
    description: "For professional use",
  },
  {
    value: "team",
    label: "Team",
    price: "$49 / mo",
    description: "For growing teams",
  },
];

const METHODS = [
  { value: "card", label: "Card", icon: CreditCardIcon },
  { value: "wallet", label: "Wallet", icon: WalletIcon },
  { value: "bank", label: "Bank", icon: LandmarkIcon },
];

/**
 * RadioCards is a single-select composition driven by `onValueChange`, so
 * stories are demoed via `render` (see Accordion).
 */
const meta = preview.meta({
  title: "Form/RadioCards",
});

export const Default = meta.story({
  render: () => {
    function Render() {
      const [plan, setPlan] = useState("pro");

      return (
        <RadioCards className="grid w-full max-w-xs gap-2" value={plan} onValueChange={setPlan}>
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
      );
    }

    return <Render />;
  },
});

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
  render: () => (
    <RadioCards className="grid w-full max-w-xs gap-2">
      {PLANS.map(({ value, label }) => (
        <RadioCardsItem key={value} value={value}>
          <span className="text-sm font-medium">{label}</span>
        </RadioCardsItem>
      ))}
    </RadioCards>
  ),
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
SelectsOnClick.test("selects on click", async ({ canvas, userEvent }) => {
  const radio = canvas.getByRole("radio", { name: "Team" });

  await userEvent.click(radio);
  await expect(radio).toBeChecked();
});
