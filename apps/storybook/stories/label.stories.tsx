import type { Meta, StoryObj } from '@storybook/react';

import { Checkbox, Label } from '@codefast/ui';
import { useId } from 'react';

const meta = {
  component: Label,
  tags: ['autodocs'],
  title: 'UI/Label',
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof Label>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => {
    const id = useId();

    return (
      <div className="flex items-center space-x-2">
        <Checkbox id={id} />
        <Label htmlFor={id} {...args}>
          Accept terms and conditions
        </Label>
      </div>
    );
  },
};
