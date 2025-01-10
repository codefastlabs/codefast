import type { Meta, StoryObj } from '@storybook/react';

import {
  Button,
  Text,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@codefast/ui';

const meta = {
  component: Tooltip,
  tags: ['autodocs'],
  title: 'UI/Tooltip',
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof Tooltip>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip {...args}>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipContent>
          <Text>Add to library</Text>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
