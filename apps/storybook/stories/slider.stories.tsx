import type { Meta, StoryObj } from '@storybook/react';

import { Slider } from '@codefast/ui';

const meta = {
  component: Slider,
  tags: ['autodocs'],
  title: 'UI/Slider',
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryObj<typeof Slider>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => <Slider className="w-[60%]" defaultValue={[50]} max={100} step={1} {...args} />,
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */
export const Disabled: Story = {
  render: (args) => (
    <Slider disabled className="w-[60%]" defaultValue={[50]} max={100} step={1} {...args} />
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Range
 * -------------------------------------------------------------------------- */

export const Range: Story = {
  render: (args) => (
    <Slider className="w-[60%]" defaultValue={[25, 75]} max={100} step={1} {...args} />
  ),
};
