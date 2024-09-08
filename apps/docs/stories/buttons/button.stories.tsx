import { Button } from '@codefast/ui/button';
import { ChevronRightIcon, EnvelopeOpenIcon } from '@radix-ui/react-icons';
import { type Meta, type StoryObj } from '@storybook/react';
import { SettingsIcon } from 'lucide-react';

const meta = {
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
      table: { defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'boolean',
      description: 'Shows a loading spinner',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    disabled: false,
    loading: false,
  },
  component: Button,
  tags: ['autodocs'],
  title: 'Components/Buttons/Button',
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => <Button {...args}>Default Button</Button>,
};

/* -----------------------------------------------------------------------------
 * Story: Secondary
 * -------------------------------------------------------------------------- */

export const Secondary: Story = {
  render: (args) => (
    <Button {...args} variant="secondary">
      Secondary Button
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Info
 * -------------------------------------------------------------------------- */

export const Info: Story = {
  render: (args) => (
    <Button {...args} variant="info">
      Info Button
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Success
 * -------------------------------------------------------------------------- */

export const Success: Story = {
  render: (args) => (
    <Button {...args} variant="success">
      Success Button
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Warning
 * -------------------------------------------------------------------------- */

export const Warning: Story = {
  render: (args) => (
    <Button {...args} variant="warning">
      Warning Button
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Destructive
 * -------------------------------------------------------------------------- */

export const Destructive: Story = {
  render: (args) => (
    <Button {...args} variant="destructive">
      Destructive Button
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Outline
 * -------------------------------------------------------------------------- */

export const Outline: Story = {
  render: (args) => (
    <Button {...args} variant="outline">
      Outline Button
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Ghost
 * -------------------------------------------------------------------------- */

export const Ghost: Story = {
  render: (args) => (
    <Button {...args} variant="ghost">
      Ghost Button
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Link
 * -------------------------------------------------------------------------- */

export const Link: Story = {
  render: (args) => (
    <Button {...args} variant="link">
      Link Button
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Sizes
 * -------------------------------------------------------------------------- */

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button {...args} prefix={<SettingsIcon />} size="xxs">
        xxs button
      </Button>
      <Button {...args} prefix={<SettingsIcon />} size="xs">
        xs button
      </Button>
      <Button {...args} prefix={<SettingsIcon />} size="sm">
        sm button
      </Button>
      <Button {...args} prefix={<SettingsIcon />} size="md">
        md button
      </Button>
      <Button {...args} prefix={<SettingsIcon />} size="lg">
        lg button
      </Button>
      <Button {...args} prefix={<SettingsIcon />} size="xl">
        xl button
      </Button>
    </div>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Icon
 * -------------------------------------------------------------------------- */

export const Icon: Story = {
  render: (args) => <Button {...args} aria-label="Next" prefix={<ChevronRightIcon />} shape="square" />,
};

/* -----------------------------------------------------------------------------
 * Story: With Icon
 * -------------------------------------------------------------------------- */

export const WithIcon: Story = {
  render: (args) => (
    <Button {...args} prefix={<EnvelopeOpenIcon />}>
      Login with Email
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Loading
 * -------------------------------------------------------------------------- */

export const Loading: Story = {
  render: (args) => (
    <Button {...args} loading>
      Please wait
    </Button>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  render: (args) => (
    <Button {...args} disabled>
      Disabled Button
    </Button>
  ),
};
