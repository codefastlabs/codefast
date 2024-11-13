import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@codefast/ui';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { type Meta, type StoryObj } from '@storybook/react';
import { useState } from 'react';

const meta = {
  component: Collapsible,
  tags: ['autodocs'],
  title: 'UI/Collapsible',
} satisfies Meta<typeof Collapsible>;

export default meta;

type Story = StoryObj<typeof Collapsible>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Collapsible className="w-[350px] space-y-2" open={isOpen} onOpenChange={setIsOpen} {...args}>
        <div className="flex items-center justify-between gap-x-4 px-3">
          <h4 className="text-sm font-semibold">@peduarte starred 3 repositories</h4>
          <CollapsibleTrigger asChild>
            <Button icon aria-label="Toggle" prefix={<CaretSortIcon />} size="sm" variant="ghost" />
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">@radix-ui/primitives</div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">@radix-ui/colors</div>
          <div className="rounded-md border px-4 py-2 font-mono text-sm shadow-sm">@stitches/react</div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};
