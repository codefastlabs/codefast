import { Button, Label, Popover, PopoverContent, PopoverTrigger, Text, TextInput } from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: Popover,
  tags: ['autodocs'],
  title: 'Components/Overlay/Popover',
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

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
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <Text className="text-muted-foreground text-sm">Set the dimensions for the layer.</Text>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <TextInput className="col-span-2" defaultValue="100%" id="width" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxWidth">Max width</Label>
              <TextInput className="col-span-2" defaultValue="300px" id="maxWidth" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Height</Label>
              <TextInput className="col-span-2" defaultValue="25px" id="height" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="maxHeight">Max. height</Label>
              <TextInput className="col-span-2" defaultValue="none" id="maxHeight" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
