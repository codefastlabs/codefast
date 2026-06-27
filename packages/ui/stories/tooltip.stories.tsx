import { InfoIcon, SaveIcon, TerminalIcon } from "lucide-react";
import { expect, screen } from "storybook/test";

import { Button } from "#/components/button";
import { Kbd, KbdGroup } from "#/components/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "#/components/tooltip";

import preview from "../.storybook/preview";

/**
 * Tooltip — a COMPOSITE overlay built from Radix primitives. The interesting props
 * live on the root `Tooltip` (open timing / default open state); the floating label
 * is portalled by `TooltipContent`. Controls bind to the root and drive `{...args}`;
 * the portalled content is documented via `subcomponents`. Content here is authored
 * for Storybook, NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { defaultOpen: false, delayDuration: 0, disableHoverableContent: false },
  argTypes: {
    defaultOpen: { control: "boolean" },
    delayDuration: { control: { max: 1000, min: 0, step: 50, type: "number" } },
    disableHoverableContent: { control: "boolean" },
    onOpenChange: { table: { disable: true } },
    open: { table: { disable: true } },
  },
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component: [
          "A small floating label that describes an element on hover or focus.",
          "",
          "**Anatomy:** `TooltipProvider > Tooltip > (TooltipTrigger + TooltipContent)`.",
          "Wrap your app (or group of tooltips) in a single `TooltipProvider` to share open/close timing.",
        ].join("\n"),
      },
    },
  },
  subcomponents: {
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  },
  title: "Overlay/Tooltip",
});

export const Default = meta.story({
  render: (args) => (
    <TooltipProvider>
      <div className="flex gap-3">
        <Tooltip {...args}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              <TerminalIcon />
              CLI
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Open terminal</p>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>`</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
        <Tooltip {...args}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              <InfoIcon />
              Info
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>More information</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
});

/** Open by default — same composition, driven purely by the `defaultOpen` arg. */
export const Open = meta.story({
  args: { defaultOpen: true },
  render: Default.input.render,
});

/** A genuinely different composition: one trigger per placement to show `side` on the content. */
export const Sides = meta.story({
  render: () => (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {(["left", "top", "bottom", "right"] as const).map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger asChild>
              <Button variant="outline" className="w-fit capitalize">
                {side}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>
              <p>Add to library</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  ),
});

/** A genuinely different composition: an icon trigger with a keyboard hint in the label. */
export const Keyboard = meta.story({
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon-sm">
            <SaveIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Save Changes <Kbd>S</Kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
});

export const ShowsOnHover = meta.story({
  render: Default.input.render,
});

/**
 * Interaction test (CSF Next `.test()`) — hovering the trigger opens the
 * portalled label. Radix renders the label TWICE (the visible copy plus an
 * accessibility copy), so query with `findAllByText` via `screen` (portalled
 * content lives outside the canvas).
 */
ShowsOnHover.test("opens the portalled label on hover", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /info/i });

  await expect(trigger).toHaveAttribute("data-state", "closed");

  await userEvent.hover(trigger);

  const labels = await screen.findAllByText(/more information/i);

  await expect(labels.length).toBeGreaterThan(0);
  await expect(trigger).toHaveAttribute("data-state", expect.stringMatching(/open/));
});
