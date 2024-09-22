import { Badge } from '@codefast/ui/badge';
import { type Meta, type StoryObj } from '@storybook/react';

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

/* -----------------------------------------------------------------------------
 * Story: Sizes
 * -------------------------------------------------------------------------- */

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Badge {...args} size="xs">
        xs badge
      </Badge>
      <Badge {...args} size="sm">
        sm badge
      </Badge>
      <Badge {...args} size="md">
        md badge
      </Badge>
      <Badge {...args} size="lg">
        lg badge
      </Badge>
      <Badge {...args} size="xl">
        xl badge
      </Badge>
    </div>
  ),
};
