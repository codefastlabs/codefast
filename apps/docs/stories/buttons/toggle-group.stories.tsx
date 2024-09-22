import { ToggleGroup, ToggleGroupItem } from '@codefast/ui/toggle-group';
import { BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  tags: ['autodocs'],
  title: 'Components/Buttons/Toggle Group',
} satisfies Meta<typeof ToggleGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <ToggleGroup icon type="multiple" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold" />
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic" />
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline" />
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Secondary
 * -------------------------------------------------------------------------- */

export const Secondary: Story = {
  render: (args) => (
    <ToggleGroup icon type="multiple" variant="secondary" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold" />
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic" />
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline" />
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Info
 * -------------------------------------------------------------------------- */

export const Info: Story = {
  render: (args) => (
    <ToggleGroup icon type="multiple" variant="info" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold" />
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic" />
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline" />
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Success
 * -------------------------------------------------------------------------- */

export const Success: Story = {
  render: (args) => (
    <ToggleGroup icon type="multiple" variant="success" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold" />
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic" />
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline" />
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Warning
 * -------------------------------------------------------------------------- */

export const Warning: Story = {
  render: (args) => (
    <ToggleGroup icon type="multiple" variant="warning" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold" />
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic" />
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline" />
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Destructive
 * -------------------------------------------------------------------------- */

export const Destructive: Story = {
  render: (args) => (
    <ToggleGroup icon type="multiple" variant="destructive" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold" />
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic" />
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline" />
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Outline
 * -------------------------------------------------------------------------- */

export const Outline: Story = {
  render: (args) => (
    <ToggleGroup icon type="multiple" variant="outline" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold" />
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic" />
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline" />
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Ghost
 * -------------------------------------------------------------------------- */

export const Ghost: Story = {
  render: (args) => (
    <ToggleGroup icon type="multiple" variant="ghost" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold" />
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic" />
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline" />
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: With Text
 * -------------------------------------------------------------------------- */

export const WithText: Story = {
  render: (args) => (
    <ToggleGroup type="multiple" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold">
        Bold
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic">
        Italic
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline">
        Underline
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Single
 * -------------------------------------------------------------------------- */

export const Single: Story = {
  render: (args) => (
    <ToggleGroup icon type="single" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold" />
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic" />
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline" />
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Small
 * -------------------------------------------------------------------------- */

export const Small: Story = {
  render: (args) => (
    <ToggleGroup icon size="sm" type="multiple" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold" />
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic" />
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline" />
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Large
 * -------------------------------------------------------------------------- */

export const Large: Story = {
  render: (args) => (
    <ToggleGroup icon size="lg" type="multiple" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold" />
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic" />
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline" />
    </ToggleGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Disabled
 * -------------------------------------------------------------------------- */

export const Disabled: Story = {
  render: (args) => (
    <ToggleGroup disabled icon type="multiple" {...args}>
      <ToggleGroupItem aria-label="Toggle bold" prefix={<BoldIcon />} value="bold" />
      <ToggleGroupItem aria-label="Toggle italic" prefix={<ItalicIcon />} value="italic" />
      <ToggleGroupItem aria-label="Toggle underline" prefix={<UnderlineIcon />} value="underline" />
    </ToggleGroup>
  ),
};
