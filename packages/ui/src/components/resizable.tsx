'use client';

import { DragHandleDots2Icon } from '@radix-ui/react-icons';
import { type ComponentProps, type JSX } from 'react';
import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: ResizablePanelGroup
 * -------------------------------------------------------------------------- */

function ResizablePanelGroup({
  className,
  ...props
}: ComponentProps<typeof ResizablePrimitive.PanelGroup>): JSX.Element {
  return (
    <ResizablePrimitive.PanelGroup
      className={cn('flex size-full', 'data-[panel-group-direction=vertical]:flex-col', className)}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ResizablePanel
 * -------------------------------------------------------------------------- */

const ResizablePanel = ResizablePrimitive.Panel;

/* -----------------------------------------------------------------------------
 * Component: ResizableHandle
 * -------------------------------------------------------------------------- */

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}): JSX.Element {
  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        'bg-border relative flex w-px items-center justify-center transition',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
        'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
        'data-[panel-group-direction=vertical]:h-px',
        'data-[panel-group-direction=vertical]:w-full',
        'data-[panel-group-direction=vertical]:after:left-0',
        'data-[panel-group-direction=vertical]:after:h-1',
        'data-[panel-group-direction=vertical]:after:w-full',
        'data-[panel-group-direction=vertical]:after:-translate-y-1/2',
        'data-[panel-group-direction=vertical]:after:translate-x-0',
        '[&[data-panel-group-direction=vertical]>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle ? (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded border">
          <DragHandleDots2Icon className="size-2.5" />
        </div>
      ) : null}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
