import { Label } from '@codefast/ui/label';
import { Checkbox } from '@codefast/ui/checkbox';
import { useId } from 'react';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Label,
  tags: ['autodocs'],
  title: 'Components/Misc/Label',
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
      <div className="flex items-center space-x-2">
        <Checkbox id={id} />
        <Label htmlFor={id} {...args}>
          Accept terms and conditions
        </Label>
      </div>
    );
  },
};
