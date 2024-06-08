import { Badge } from '@codefast/ui/badge';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  argTypes: {
    variant: {
      control: { type: 'inline-radio' },
      description: 'The variant of the badge.',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
  args: {
    variant: 'default',
  },
  component: Badge,
  tags: ['autodocs'],
  title: 'UIs/Badge',
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Secondary
 * -------------------------------------------------------------------------- */

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Badge',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Destructive
 * -------------------------------------------------------------------------- */

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive Badge',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Outline
 * -------------------------------------------------------------------------- */

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Badge',
  },
};
