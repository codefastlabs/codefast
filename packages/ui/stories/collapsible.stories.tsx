import { ChevronDownIcon, MaximizeIcon, MinimizeIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";
import { useState } from "react";
import { expect } from "storybook/test";

import { Button } from "#/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "#/components/collapsible";
import { Field, FieldGroup, FieldLabel } from "#/components/field";
import { Input } from "#/components/input";

import preview from "../.storybook/preview";

const LINE_ITEMS = [
  { name: "Pro plan (annual)", price: "$144.00" },
  { name: "Extra seats × 3", price: "$36.00" },
  { name: "Tax", price: "$14.40" },
];

function OrderSummary(props: ComponentProps<typeof Collapsible>): JSX.Element {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible className="group w-full max-w-xs rounded-xl border" open={open} onOpenChange={setOpen} {...props}>
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
  );
}

function RadiusSettings(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="mx-auto w-full max-w-xs" size="sm">
      <CardHeader>
        <CardTitle>Radius</CardTitle>
        <CardDescription>Set the corner radius of the element.</CardDescription>
      </CardHeader>
      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex items-start gap-2">
          <FieldGroup className="grid w-full grid-cols-2 gap-2">
            <Field>
              <FieldLabel htmlFor="radius-x" className="sr-only">
                Radius X
              </FieldLabel>
              <Input id="radius" placeholder="0" defaultValue={0} />
            </Field>
            <Field>
              <FieldLabel htmlFor="radius-y" className="sr-only">
                Radius Y
              </FieldLabel>
              <Input id="radius" placeholder="0" defaultValue={0} />
            </Field>
            <CollapsibleContent className="col-span-full grid grid-cols-subgrid gap-2">
              <Field>
                <FieldLabel htmlFor="radius-x" className="sr-only">
                  Radius X
                </FieldLabel>
                <Input id="radius" placeholder="0" defaultValue={0} />
              </Field>
              <Field>
                <FieldLabel htmlFor="radius-y" className="sr-only">
                  Radius Y
                </FieldLabel>
                <Input id="radius" placeholder="0" defaultValue={0} />
              </Field>
            </CollapsibleContent>
          </FieldGroup>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="icon">
              {isOpen ? <MinimizeIcon /> : <MaximizeIcon />}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

const meta = preview.meta({
  args: { defaultOpen: false, disabled: false },
  argTypes: {
    asChild: { table: { disable: true } },
    onOpenChange: { table: { disable: true } },
    open: { table: { disable: true } },
  },
  component: Collapsible,
  subcomponents: { CollapsibleTrigger, CollapsibleContent },
  parameters: {
    docs: {
      description: {
        component: [
          "An interactive panel that expands and collapses a single section of content.",
          "",
          "**Anatomy:** `Collapsible > (CollapsibleTrigger + CollapsibleContent)`.",
          "Control open state with `open`/`onOpenChange` or leave it uncontrolled with `defaultOpen`.",
        ].join("\n"),
      },
    },
  },
  title: "Layout/Collapsible",
});

export const Default = meta.story({
  render: (args) => <OrderSummary {...args} />,
});

export const Basic = meta.story({
  render: () => (
    <Card className="mx-auto w-full max-w-sm">
      <CardContent>
        <Collapsible className="rounded-md data-[state=open]:bg-muted">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="group w-full">
              Product details
              <ChevronDownIcon className="ms-auto group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm">
            <div>This panel can be expanded or collapsed to reveal additional content.</div>
            <Button size="xs">Learn More</Button>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  ),
});

export const Settings = meta.story({
  render: () => <RadiusSettings />,
});

export const ExpandsOnClick = meta.story({
  render: Basic.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ExpandsOnClick.test("expands on click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /product details/i });

  await userEvent.click(trigger);
  await expect(await canvas.findByText(/this panel can be expanded/i)).toBeVisible();
});
