'use client';

import type { ComponentPropsWithoutRef, JSX } from 'react';

import { cn } from '@codefast/ui';

import { getComponentName } from '@/lib/utils';

export function ComponentWrapper({
  className,
  name,
  children,
  classNames,
  ...props
}: ComponentPropsWithoutRef<'div'> & {
  name: string;
  classNames?: {
    body?: string;
    container?: string;
    header?: string;
  };
}): JSX.Element {
  return (
    <div
      className={cn('scroll-mt-18.25 flex w-full min-w-0 flex-col rounded-lg border', classNames?.container, className)}
      data-name={name.toLowerCase()}
      id={name}
      {...props}
    >
      <div className={cn('bg-muted/20 rounded-t-lg border-b px-4 py-3', classNames?.header)}>
        <div className="text-sm font-medium">{getComponentName(name)}</div>
      </div>
      <div className={cn('flex flex-1 items-center gap-2 p-4', classNames?.body)}>{children}</div>
    </div>
  );
}
