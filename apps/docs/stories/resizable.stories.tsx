import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@codefast/ui/resizable';
import { Box } from '@codefast/ui/box';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  tags: ['autodocs'],
  title: 'UIs/Resizable',
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/* -----------------------------------------------------------------------------
 * Story: Default
 * -------------------------------------------------------------------------- */

export const Default: Story = {
  render: (args) => (
    <ResizablePanelGroup direction="horizontal" className="max-w-md rounded-lg border" {...args}>
      <ResizablePanel defaultSize={50}>
        <Box className="flex h-[200px] items-center justify-center p-6">
          <Box as="span" className="font-semibold">
            One
          </Box>
        </Box>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={25}>
            <Box className="flex h-full items-center justify-center p-6">
              <Box as="span" className="font-semibold">
                Two
              </Box>
            </Box>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={75}>
            <Box className="flex h-full items-center justify-center p-6">
              <Box as="span" className="font-semibold">
                Three
              </Box>
            </Box>
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
    <ResizablePanelGroup direction="vertical" className="min-h-[200px] max-w-md rounded-lg border" {...args}>
      <ResizablePanel defaultSize={25}>
        <Box className="flex h-full items-center justify-center p-6">
          <Box as="span" className="font-semibold">
            Header
          </Box>
        </Box>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={75}>
        <Box className="flex h-full items-center justify-center p-6">
          <Box as="span" className="font-semibold">
            Content
          </Box>
        </Box>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

/* -----------------------------------------------------------------------------
 * Story: Handle
 * -------------------------------------------------------------------------- */

export const Handle: Story = {
  render: (args) => (
    <ResizablePanelGroup direction="horizontal" className="min-h-[200px] max-w-md rounded-lg border" {...args}>
      <ResizablePanel defaultSize={25}>
        <Box className="flex h-full items-center justify-center p-6">
          <Box as="span" className="font-semibold">
            Sidebar
          </Box>
        </Box>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <Box className="flex h-full items-center justify-center p-6">
          <Box as="span" className="font-semibold">
            Content
          </Box>
        </Box>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};
