import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from '@codefast/ui';

const meta = {
  args: {
    variant: 'default',
  },
  component: Badge,
  tags: ['autodocs'],
  title: 'UI/Badge',
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof Badge>;

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
    children: 'Secondary Badge',
    variant: 'secondary',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Info
 * -------------------------------------------------------------------------- */

export const Info: Story = {
  args: {
    children: 'Info Badge',
    variant: 'info',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Success
 * -------------------------------------------------------------------------- */

export const Success: Story = {
  args: {
    children: 'Success Badge',
    variant: 'success',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Warning
 * -------------------------------------------------------------------------- */

export const Warning: Story = {
  args: {
    children: 'Warning Badge',
    variant: 'warning',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Destructive
 * -------------------------------------------------------------------------- */

export const Destructive: Story = {
  args: {
    children: 'Destructive Badge',
    variant: 'destructive',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Outline
 * -------------------------------------------------------------------------- */

export const Outline: Story = {
  args: {
    children: 'Outline Badge',
    variant: 'outline',
  },
};
