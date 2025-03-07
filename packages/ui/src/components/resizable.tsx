'use client';

import type { ComponentProps, JSX } from 'react';

import { GripVerticalIcon } from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: ResizablePanelGroup
 * -------------------------------------------------------------------------- */

type ResizablePanelGroupProps = ComponentProps<typeof ResizablePrimitive.PanelGroup>;

function ResizablePanelGroup({ className, ...props }: ResizablePanelGroupProps): JSX.Element {
  return (
    <ResizablePrimitive.PanelGroup
      className={cn('flex size-full data-[panel-group-direction=vertical]:flex-col', className)}
      data-slot="resizable-panel-group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ResizablePanel
 * -------------------------------------------------------------------------- */

type ResizablePanelProps = ComponentProps<typeof ResizablePrimitive.Panel>;

function ResizablePanel({ ...props }: ResizablePanelProps): JSX.Element {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: ResizableHandle
 * -------------------------------------------------------------------------- */

interface ResizableHandleProps extends ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> {
  withHandle?: boolean;
}

function ResizableHandle({ className, withHandle, ...props }: ResizableHandleProps): JSX.Element {
  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        'bg-border focus-visible:ring-ring focus-visible:ring-3 relative flex w-px items-center justify-center transition after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90',
        className,
      )}
      data-slot="resizable-handle"
      {...props}
    >
      {withHandle ? (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-sm border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      ) : null}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { ResizableHandleProps, ResizablePanelGroupProps, ResizablePanelProps };
export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
