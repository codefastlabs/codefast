import { ChevronDownIcon } from "lucide-react";
import { expect } from "storybook/test";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "#/components/collapsible";

import preview from "../.storybook/preview";

const LINE_ITEMS = [
  { name: "Pro plan (annual)", price: "$144.00" },
  { name: "Extra seats × 3", price: "$36.00" },
  { name: "Tax", price: "$14.40" },
];

/**
 * Collapsible — a COMPOSITE built on Radix `Collapsible.Root`. The root is a normal
 * component whose own props (`defaultOpen`, `disabled`, controlled `open`/`onOpenChange`)
 * drive the open state, so `{...args}` binds straight to it. The trigger toggles a single
 * region of content shown/hidden via `CollapsibleContent`.
 *
 * Content is authored for Storybook against the component's own public API — it is NOT
 * synced with or copied from the apps/web registry.
 */
const meta = preview.meta({
  args: { defaultOpen: false, disabled: false },
  argTypes: {
    asChild: { table: { disable: true } },
    defaultOpen: { control: "boolean" },
    disabled: { control: "boolean" },
    onOpenChange: { table: { disable: true } },
    open: { table: { disable: true } },
  },
  component: Collapsible,
  parameters: {
    controls: { include: ["defaultOpen", "disabled"] },
    docs: {
      description: {
        component: [
          "An interactive panel that expands and collapses a single section of content.",
          "",
          "**Anatomy:** `Collapsible > (CollapsibleTrigger + CollapsibleContent)`.",
          "Leave it uncontrolled with `defaultOpen`, or own the state with `open`/`onOpenChange`.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { CollapsibleContent, CollapsibleTrigger },
  title: "Layout/Collapsible",
});

export const Default = meta.story({
  render: (args) => (
    <Collapsible className="group w-full max-w-xs rounded-xl border" {...args}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start">
        <span className="text-sm font-medium text-foreground">Order summary</span>
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          $194.40
          <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-t px-4 py-3">
        {LINE_ITEMS.map(({ name, price }) => (
          <div key={name} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{name}</span>
            <span className="text-foreground">{price}</span>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  ),
});

export const Open = meta.story({
  args: { defaultOpen: true },
  render: Default.input.render,
});

export const Disabled = meta.story({
  args: { defaultOpen: true, disabled: true },
  render: Default.input.render,
});

export const ExpandsOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ExpandsOnClick.test("trigger toggles the content region open and closed", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /order summary/i });

  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await userEvent.click(trigger);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(await canvas.findByText("Pro plan (annual)")).toBeVisible();

  await userEvent.click(trigger);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});
