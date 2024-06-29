import { Toggle } from '@codefast/ui/toggle';
import { Bold, Italic, Underline } from 'lucide-react';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Toggle,
  tags: ['autodocs'],
  title: 'UIs/Toggle',
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Toggle aria-label="Toggle bold" {...args}>
      <Bold className="size-4" />
    </Toggle>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Outline
 * -------------------------------------------------------------------------- */

export const Outline: Story = {
  render: (args) => (
    <Toggle aria-label="Toggle italic" variant="outline" {...args}>
      <Italic className="size-4" />
    </Toggle>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: With Text
 * -------------------------------------------------------------------------- */

export const WithText: Story = {
  render: (args) => (
    <Toggle aria-label="Toggle italic" {...args}>
      <Italic className="mr-2 size-4" />
      Italic
    </Toggle>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Small
 * -------------------------------------------------------------------------- */

export const Small: Story = {
  render: (args) => (
    <Toggle size="sm" aria-label="Toggle italic" {...args}>
      <Italic className="size-4" />
    </Toggle>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Large
 * -------------------------------------------------------------------------- */

export const Large: Story = {
  render: (args) => (
    <Toggle size="lg" aria-label="Toggle italic" {...args}>
      <Italic className="size-4" />
    </Toggle>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  render: (args) => (
    <Toggle aria-label="Toggle underline" disabled {...args}>
      <Underline className="size-4" />
    </Toggle>
  ),
};
