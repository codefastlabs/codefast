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
      className={cn('flex w-full scroll-mt-16 flex-col rounded-lg border', className)}
      data-name={name.toLowerCase()}
      id={name}
      {...props}
    >
      <div className="border-b px-4 py-3">
        <div className="text-sm font-medium">{getComponentName(name)}</div>
      </div>

      <div className="flex flex-1 items-center gap-2 p-4">{children}</div>
    </div>
  );
}
