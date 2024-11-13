import { CheckboxCards, CheckboxCardsItem, Text } from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  component: CheckboxCards,
  tags: ['autodocs'],
  title: 'UI/Checkbox Cards',
} satisfies Meta<typeof CheckboxCards>;

export default meta;

type Story = StoryObj<typeof CheckboxCards>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <div>
      <CheckboxCards className="grid-cols-1 sm:grid-cols-3" defaultValue={['1']} {...args}>
        <CheckboxCardsItem value="1">
          <div className="flex w-full flex-col items-start">
            <Text className="font-bold">8-core CPU</Text>
            <Text>32GB RAM</Text>
          </div>
        </CheckboxCardsItem>
        <CheckboxCardsItem value="2">
          <div className="flex w-full flex-col items-start">
            <Text className="font-bold">6-core CPU</Text>
            <Text>24GB RAM</Text>
          </div>
        </CheckboxCardsItem>
        <CheckboxCardsItem value="3">
          <div className="flex w-full flex-col items-start">
            <Text className="font-bold">4-core CPU</Text>
            <Text>16GB RAM</Text>
          </div>
        </CheckboxCardsItem>
      </CheckboxCards>
    </div>
  ),
};
