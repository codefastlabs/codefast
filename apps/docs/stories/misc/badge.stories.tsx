import { Badge } from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';
import { ShieldCheckIcon } from 'lucide-react';

const meta = {
  args: {
    variant: 'default',
  },
  component: Badge,
  tags: ['autodocs'],
  title: 'Components/Misc/Badge',
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
 * Story: Sizes
 * -------------------------------------------------------------------------- */

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Badge {...args} prefix={<ShieldCheckIcon />} size="xs">
        xs badge
      </Badge>
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
      <Badge {...args} prefix={<ShieldCheckIcon />} size="xs" variant="outline">
        xs badge
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
    </div>
  ),
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
 * Story: Info
 * -------------------------------------------------------------------------- */

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Info Badge',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Success
 * -------------------------------------------------------------------------- */

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Badge',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Warning
 * -------------------------------------------------------------------------- */

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning Badge',
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
