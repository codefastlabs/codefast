import { Slider } from '@codefast/ui/slider';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  component: Slider,
  tags: ['autodocs'],
  title: 'UIs/Slider',
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => <Slider defaultValue={[50]} max={100} step={1} className="w-[60%]" {...args} />,
};

/* -----------------------------------------------------------------------------
 * Story: Range
 * -------------------------------------------------------------------------- */

export const Range: Story = {
  render: (args) => <Slider defaultValue={[25, 75]} max={100} step={1} className="w-[60%]" {...args} />,
};
