import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from '@codefast/ui';
import { ShieldCheckIcon } from 'lucide-react';

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
 * Story: Sizes
 * -------------------------------------------------------------------------- */

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Badge {...args} prefix={<ShieldCheckIcon />} size="sm">
        sm badge
      </Badge>
      <Badge {...args} prefix={<ShieldCheckIcon />} size="md">
        md badge
      </Badge>
      <Badge {...args} prefix={<ShieldCheckIcon />} size="lg">
        lg badge
      </Badge>
      <Badge {...args} prefix={<ShieldCheckIcon />} size="xl">
        xl badge
      </Badge>
      <Badge {...args} prefix={<ShieldCheckIcon />} size="2xl">
        2xl badge
      </Badge>

      <Badge {...args} prefix={<ShieldCheckIcon />} size="sm" variant="outline">
        sm badge
      </Badge>
      <Badge {...args} prefix={<ShieldCheckIcon />} size="md" variant="outline">
        md badge
      </Badge>
      <Badge {...args} prefix={<ShieldCheckIcon />} size="lg" variant="outline">
        lg badge
      </Badge>
      <Badge {...args} prefix={<ShieldCheckIcon />} size="xl" variant="outline">
        xl badge
      </Badge>
      <Badge {...args} prefix={<ShieldCheckIcon />} size="2xl" variant="outline">
        2xl badge
      </Badge>
    </div>
  ),
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
