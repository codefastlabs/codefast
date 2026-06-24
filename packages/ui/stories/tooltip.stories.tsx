import { InfoIcon, SaveIcon, TerminalIcon } from "lucide-react";
import { expect, screen } from "storybook/test";

import { Button } from "#/components/button";
import { Kbd, KbdGroup } from "#/components/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "#/components/tooltip";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { defaultOpen: false, disableHoverableContent: false },
  argTypes: {
    onOpenChange: { table: { disable: true } },
    open: { table: { disable: true } },
  },
  component: Tooltip,
  subcomponents: {
    TooltipProvider,
    TooltipTrigger,
    TooltipContent,
  },
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

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
ShowsOnHover.test("shows on hover", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /info/i });

  // Focusing also opens a Radix tooltip and is more robust than hover in headless runs.
  await userEvent.hover(trigger);
  trigger.focus();

  const matches = await screen.findAllByText(/more information/i);

  await expect(matches.length).toBeGreaterThan(0);
});
