import { Label } from '@codefast/ui/label';
import { Checkbox } from '@codefast/ui/checkbox';
import { useId } from 'react';
import { Box } from '@codefast/ui/box';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  component: Label,
  tags: ['autodocs'],
  title: 'UIs/Label',
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => {
    const id = useId();

    return (
      <Box className="flex items-center space-x-2">
        <Checkbox id={id} />
        <Label htmlFor={id} {...args}>
          Accept terms and conditions
        </Label>
      </Box>
    );
  },
};
