import type { Meta, StoryObj } from "@storybook/react-vite";
import { InfoIcon, SaveIcon, TerminalIcon } from "lucide-react";
import { expect, screen, userEvent, within } from "storybook/test";

import { Button } from "#/components/button";
import { Kbd, KbdGroup } from "#/components/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "#/components/tooltip";

const meta = { title: "Overlay/Tooltip" } satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex gap-3">
        <Tooltip>
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
        <Tooltip>
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
};

export const Sides: Story = {
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
};

export const Keyboard: Story = {
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
};

/** Interaction test — runs in a real browser via `vitest run --project=storybook`. */
export const ShowsOnHover: Story = {
  render: Default.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /info/i });

    // Focusing also opens a Radix tooltip and is more robust than hover in headless runs.
    await userEvent.hover(trigger);
    trigger.focus();

    const matches = await screen.findAllByText(/more information/i);

    await expect(matches.length).toBeGreaterThan(0);
  },
};
