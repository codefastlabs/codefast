import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@codefast/ui/tooltip';
import { Button } from '@codefast/ui/button';
import { Text } from '@codefast/ui/text';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Tooltip,
  tags: ['autodocs'],
  title: 'UIs/Tooltip',
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
