import type { Meta, StoryObj } from "@storybook/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TooltipArrow,
  TooltipPortal,
} from "@codefast/ui/tooltip";
import { Button } from "@codefast/ui/button";

const meta = {
  component: Tooltip,
  tags: ["autodocs"],
  title: "UIs/Tooltip",
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <TooltipProvider>
      <Tooltip open {...args}>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>
            <p>Add to library</p>
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  ),
};
