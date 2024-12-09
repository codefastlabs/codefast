import { Separator, SeparatorItem, Text } from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  args: {
    align: 'start',
    orientation: 'horizontal',
  },
  argTypes: {
    align: {
      control: 'inline-radio',
      description: 'Choose the alignment of the separator.',
      options: ['start', 'center', 'end'],
      table: { defaultValue: { summary: 'start' } },
    },
    orientation: {
      control: { type: 'inline-radio' },
      description: 'Choose the orientation of the separator.',
      options: ['horizontal', 'vertical'],
      table: { defaultValue: { summary: 'horizontal' } },
    },
  },
  component: Separator,
  tags: ['autodocs'],
  title: 'UI/Separator',
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof Separator>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: () => (
    <div>
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
        <Text className="text-muted-foreground text-sm">An open-source UI component library.</Text>
      </div>
      <Separator className="my-4" />
      <div className="flex items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator className="h-4" orientation="vertical" />
        <div>Docs</div>
        <Separator className="h-4" orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Vertical
 * -------------------------------------------------------------------------- */

export const Vertical: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <div>Blog</div>
      <Separator className="h-4" orientation="vertical" />
      <div>Docs</div>
      <Separator className="h-4" orientation="vertical" />
      <div>Source</div>
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Label
 * -------------------------------------------------------------------------- */

export const Label: Story = {
  render: (args) => (
    <div>
      <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
      <Separator className="my-4" {...args} orientation="horizontal">
        <SeparatorItem>or</SeparatorItem>
      </Separator>
      <Text className="text-muted-foreground text-sm">An open-source UI component library.</Text>
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Vertical Label
 * -------------------------------------------------------------------------- */

export const VerticalLabel: Story = {
  args: {
    align: 'center',
    orientation: 'vertical',
  },

  render: (args) => (
    <div className="inline-grid grid-flow-col space-x-4">
      <div className="flex size-20 items-center justify-center border border-dashed">Blog</div>
      <Separator {...args} orientation="vertical">
        <SeparatorItem>or</SeparatorItem>
      </Separator>
      <div className="flex size-20 items-center justify-center border border-dashed">Docs</div>
    </div>
  ),
};
