import { Button, Text, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Tooltip,
  tags: ['autodocs'],
  title: 'Components/Overlay/Tooltip',
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

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
