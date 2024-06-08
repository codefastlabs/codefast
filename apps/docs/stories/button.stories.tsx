import { Button } from '@codefast/ui/button';
import { Spinner } from '@codefast/ui/spinner';
import { ChevronRightIcon, EnvelopeOpenIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  argTypes: {
    variant: {
      control: { type: 'inline-radio' },
      description: 'The variant of the button.',
      options: ['default', 'secondary', 'outline', 'destructive', 'ghost', 'link'],
    },
    size: {
      control: { type: 'inline-radio' },
      description: 'The size of the button.',
      options: ['sm', 'default', 'lg'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    loading: {
      control: { type: 'boolean' },
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
    loading: false,
  },
  component: Button,
  tags: ['autodocs'],
  title: 'UIs/Button',
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  args: {
    children: 'Click me',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Secondary
 * -------------------------------------------------------------------------- */

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Outline
 * -------------------------------------------------------------------------- */

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Destructive
 * -------------------------------------------------------------------------- */

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive Button',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Ghost
 * -------------------------------------------------------------------------- */

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Link
 * -------------------------------------------------------------------------- */

export const AsLink: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Small
 * -------------------------------------------------------------------------- */

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Large
 * -------------------------------------------------------------------------- */

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

/* -----------------------------------------------------------------------------
 * Story: Icon
 * -------------------------------------------------------------------------- */

export const Icon: Story = {
  args: {
    variant: 'outline',
    size: 'icon',
  },
  render: (args) => (
    <Button {...args}>
      <ChevronRightIcon className="size-4" />
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: With Icon
 * -------------------------------------------------------------------------- */

export const WithIcon: Story = {
  render: (args) => (
    <Button {...args}>
      <EnvelopeOpenIcon className="size-4" /> Login with Email
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Loading
 * -------------------------------------------------------------------------- */

export const Loading: Story = {
  args: {
    loading: true,
  },
  render: (args) => <Button {...args}>Please wait</Button>,
};

/* -----------------------------------------------------------------------------
 * Story: LoadingSpinner
 * -------------------------------------------------------------------------- */

export const LoadingSpinner: Story = {
  args: {
    disabled: true,
  },
  render: (args) => (
    <Button {...args}>
      <Spinner />
      Please wait
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: As Child
 * -------------------------------------------------------------------------- */

export const AsChild: Story = {
  args: {
    asChild: true,
  },
  render: (args) => (
    <Button {...args}>
      <Link href="/">Login</Link>
    </Button>
  ),
};
