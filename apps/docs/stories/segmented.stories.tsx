import type { Meta, StoryObj } from "@storybook/react";
import { Segmented, SegmentedItem } from "@codefast/ui/segmented";

const meta = {
  component: Segmented,
  tags: ["autodocs"],
  title: "UIs/Segmented",
} satisfies Meta<typeof Segmented>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <Segmented defaultValue="inbox" {...args}>
      <SegmentedItem value="inbox">Inbox</SegmentedItem>
      <SegmentedItem value="drafts">Drafts</SegmentedItem>
      <SegmentedItem value="sent">Sent</SegmentedItem>
      <SegmentedItem value="unsent">Unsent</SegmentedItem>
      <SegmentedItem value="none">None</SegmentedItem>
    </Segmented>
  ),
};
