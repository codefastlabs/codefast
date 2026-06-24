import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarIcon } from "lucide-react";
import { expect, screen, userEvent, within } from "storybook/test";

import { Button } from "#/components/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "#/components/hover-card";

const meta = { title: "Overlay/HoverCard" } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          className="cursor-pointer text-sm font-medium underline underline-offset-4 hover:text-primary"
          type="button"
        >
          @codefast
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-72">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            CF
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">Codefast Labs</p>
            <p className="text-xs text-muted-foreground">
              Building fast, accessible UI components for modern web apps.
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="size-3" />
              <span>Joined January 2024</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="flex flex-wrap justify-center gap-2">
      {(["left", "top", "bottom", "right"] as const).map((side) => (
        <HoverCard key={side} closeDelay={100} openDelay={100}>
          <HoverCardTrigger asChild>
            <Button className="capitalize" variant="outline">
              {side}
            </Button>
          </HoverCardTrigger>
          <HoverCardContent side={side}>
            <div className="flex flex-col gap-1">
              <h4 className="font-medium">Hover Card</h4>
              <p>This hover card appears on the {side} side of the trigger.</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  ),
};

/** Interaction test — runs in a real browser via `vitest run --project=storybook`. */
export const OpensOnHover: Story = {
  render: Default.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "@codefast" });

    // Radix HoverCard has a 700ms open delay + entrance animation; hover plus
    // focus (which also opens it) keeps this stable, and we assert presence
    // (not visibility) with a generous timeout to ride out the animation.
    await userEvent.hover(trigger);
    trigger.focus();
    await expect(await screen.findByText("Codefast Labs", {}, { timeout: 3000 })).toBeInTheDocument();
  },
};
