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

const meta = preview.meta({ title: "Overlay/Popover" });

export const Default = meta.story({
  render: () => (
    <Popover>
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
OpensOnClick.test("opens on click", async ({ canvas, userEvent }) => {
  const trigger = canvas.getByRole("button", { name: /open popover/i });

  await userEvent.click(trigger);

  await expect(await screen.findByText(/set the dimensions for the layer/i)).toBeInTheDocument();
  await expect(await screen.findByText("Dimensions")).toBeInTheDocument();
});
