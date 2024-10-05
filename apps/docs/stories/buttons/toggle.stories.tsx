import { Toggle } from '@codefast/ui';
import { BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Toggle,
  tags: ['autodocs'],
  title: 'Components/Buttons/Toggle',
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Toggle aria-label="Toggle bold" {...args}>
      <BoldIcon />
    </Toggle>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Secondary
 * -------------------------------------------------------------------------- */

export const Secondary: Story = {
  render: (args) => (
    <Toggle
      icon
      aria-label="Toggle italic"
      prefix={<ItalicIcon />}
      variant="secondary"
      {...args}
    />
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Info
 * -------------------------------------------------------------------------- */

export const Info: Story = {
  render: (args) => (
    <Toggle
      icon
      aria-label="Toggle italic"
      prefix={<ItalicIcon />}
      variant="info"
      {...args}
    />
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Success
 * -------------------------------------------------------------------------- */

export const Success: Story = {
  render: (args) => (
    <Toggle
      icon
      aria-label="Toggle italic"
      prefix={<ItalicIcon />}
      variant="success"
      {...args}
    />
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Warning
 * -------------------------------------------------------------------------- */

export const Warning: Story = {
  render: (args) => (
    <Toggle
      icon
      aria-label="Toggle italic"
      prefix={<ItalicIcon />}
      variant="warning"
      {...args}
    />
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Destructive
 * -------------------------------------------------------------------------- */

export const Destructive: Story = {
  render: (args) => (
    <Toggle
      icon
      aria-label="Toggle italic"
      prefix={<ItalicIcon />}
      variant="destructive"
      {...args}
    />
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Outline
 * -------------------------------------------------------------------------- */

export const Outline: Story = {
  render: (args) => (
    <Toggle
      icon
      aria-label="Toggle italic"
      prefix={<ItalicIcon />}
      variant="outline"
      {...args}
    />
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Ghost
 * -------------------------------------------------------------------------- */

export const Ghost: Story = {
  render: (args) => (
    <Toggle
      icon
      aria-label="Toggle italic"
      prefix={<ItalicIcon />}
      variant="ghost"
      {...args}
    />
  ),
};

/* -----------------------------------------------------------------------------
 * Story: With Text
 * -------------------------------------------------------------------------- */

export const WithText: Story = {
  render: (args) => (
    <Toggle aria-label="Toggle italic" prefix={<ItalicIcon />} {...args}>
      Italic
    </Toggle>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Small
 * -------------------------------------------------------------------------- */

export const Small: Story = {
  render: (args) => (
    <Toggle
      icon
      aria-label="Toggle italic"
      prefix={<ItalicIcon />}
      size="sm"
      {...args}
    />
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Large
 * -------------------------------------------------------------------------- */

export const Large: Story = {
  render: (args) => (
    <Toggle
      icon
      aria-label="Toggle italic"
      prefix={<ItalicIcon />}
      size="lg"
      {...args}
    />
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  render: (args) => (
    <Toggle
      disabled
      icon
      aria-label="Toggle underline"
      prefix={<UnderlineIcon />}
      {...args}
    />
  ),
};
