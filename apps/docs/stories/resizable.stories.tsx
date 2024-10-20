import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@codefast/ui';
import { type Meta, type StoryObj } from '@storybook/react';

const meta = {
  tags: ['autodocs'],
  title: 'UI/Resizable',
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;

type Story = StoryObj<typeof ResizablePanelGroup>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <ResizablePanelGroup
      className="max-w-md rounded-lg border"
      {...args}
      direction="horizontal"
    >
      <ResizablePanel defaultSize={50}>
        <div className="flex h-[200px] items-center justify-center p-6">
          <span className="font-semibold">One</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={25}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Two</span>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={75}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Three</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Vertical
 * -------------------------------------------------------------------------- */

export const Vertical: Story = {
  render: (args) => (
    <ResizablePanelGroup
      className="min-h-[200px] max-w-md rounded-lg border"
      {...args}
      direction="vertical"
    >
      <ResizablePanel defaultSize={25}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Header</span>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={75}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Content</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Handle
 * -------------------------------------------------------------------------- */

export const Handle: Story = {
  render: (args) => (
    <ResizablePanelGroup
      className="min-h-[200px] max-w-md rounded-lg border"
      {...args}
      direction="horizontal"
    >
      <ResizablePanel defaultSize={25}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Sidebar</span>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Content</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};
