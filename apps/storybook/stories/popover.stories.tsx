import type { Meta, StoryObj } from '@storybook/react';

import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger, Text } from '@codefast/ui';

const meta = {
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'UI/Popover',
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof Popover>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <Text className="text-muted-foreground text-sm">Set the dimensions for the layer.</Text>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input className="col-span-2" defaultValue="100%" id="width" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max width</Label>
              <Input className="col-span-2" defaultValue="300px" id="maxWidth" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <Input className="col-span-2" defaultValue="25px" id="height" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <Input className="col-span-2" defaultValue="none" id="maxHeight" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
