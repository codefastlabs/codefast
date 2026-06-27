import { expect, screen } from "storybook/test";

import { Button } from "#/components/button";
import { Input } from "#/components/input";
import { Label } from "#/components/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "#/components/popover";

import preview from "../.storybook/preview";

/**
 * Popover — a COMPOSITE overlay whose root (`Popover`) is a Radix context
 * provider with no DOM of its own; the open/close state lives on the root while
 * the floating panel is portalled out via `PopoverContent`. The root's useful
 * controls are the `defaultOpen` and `modal` booleans (controlled `open` /
 * `onOpenChange` are hidden as noise). All content here is authored for
 * Storybook against the component's own public API, NOT synced with the
 * apps/web registry.
 */
const meta = preview.meta({
  args: { defaultOpen: false, modal: false },
  argTypes: {
    defaultOpen: { control: "boolean" },
    modal: { control: "boolean" },
    onOpenChange: { table: { disable: true } },
    open: { table: { disable: true } },
  },
  component: Popover,
  parameters: {
    docs: {
      description: {
        component: [
          "A non-modal floating panel anchored to a trigger, for rich content and quick edits.",
          "",
          "**Anatomy:** `Popover > PopoverTrigger + PopoverContent > (PopoverHeader (PopoverTitle · PopoverDescription) + content)`.",
          "Tune placement with `side`/`align` on `PopoverContent`.",
        ].join("\n"),
      },
    },
  },
  subcomponents: {
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
  },
  title: "Overlay/Popover",
});

export const Default = meta.story({
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="grid gap-3">
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
          </PopoverHeader>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-3">
              <Label className="text-xs">Width</Label>
              <Input defaultValue="100%" className="col-span-2 h-7 text-xs" />
            </div>
            <div className="grid grid-cols-3 items-center gap-3">
              <Label className="text-xs">Height</Label>
              <Input defaultValue="auto" className="col-span-2 h-7 text-xs" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
});

/** Same composition, opened on mount via the `defaultOpen` root prop. */
export const OpenByDefault = meta.story({
  args: { defaultOpen: true },
  render: Default.input.render,
});

/**
 * A genuinely different composition: three triggers demonstrating how `align`
 * on `PopoverContent` positions the floating panel relative to its anchor.
 */
export const Alignments = meta.story({
  render: () => (
    <div className="flex gap-6">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Start
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-40">
          Aligned to start
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Center
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-40">
          Aligned to center
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            End
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-40">
          Aligned to end
        </PopoverContent>
      </Popover>
    </div>
  ),
});

export const OpensOnClick = meta.story({
  render: Default.input.render,
});

/** Interaction test (CSF Next `.test()`) — runs in a real browser via `test:stories`. */
OpensOnClick.test("opens the portalled panel and flips aria-expanded", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /open popover/i });

  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await userEvent.click(trigger);

  // Portalled content lives outside the canvas — query via screen.
  await expect(await screen.findByText("Dimensions")).toBeInTheDocument();
  await expect(await screen.findByText(/set the dimensions for the layer/i)).toBeInTheDocument();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
});
