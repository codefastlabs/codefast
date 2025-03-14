'use client';

import type { ComponentPropsWithoutRef, JSX } from 'react';

import { cn } from '@codefast/ui';

import { getComponentName } from '@/lib/utils';

export function ComponentWrapper({
  className,
  name,
  children,
  ...props
}: ComponentPropsWithoutRef<'div'> & { name: string }): JSX.Element {
  return (
    <div
      className={cn('scroll-mt-18.25 flex w-full min-w-0 flex-col rounded-lg border', className)}
      data-name={name.toLowerCase()}
      id={name}
      {...props}
    >
      <div className="bg-muted/20 rounded-t-lg border-b px-4 py-3">
        <div className="text-sm font-medium">{getComponentName(name)}</div>
      </div>

      <div className="flex flex-1 items-center gap-2 overflow-auto p-4">{children}</div>
    </div>
  );
}
