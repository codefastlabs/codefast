'use client';

import type { ComponentPropsWithoutRef, ErrorInfo, JSX, ReactNode } from 'react';

import { cn, logger } from '@codefast/ui';
import { Component } from 'react';

import { getComponentName } from '@/lib/utils';

export function ComponentWrapper({
  className,
  name,
  children,
  ...props
}: ComponentPropsWithoutRef<'div'> & { name: string }): JSX.Element {
  return (
    <ErrorBoundary name={name}>
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
    </ErrorBoundary>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode; name: string }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: true } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error(`Error in component ${this.props.name}:`, error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <div className="p-4 text-red-500">Something went wrong in component: {this.props.name}</div>;
    }

    return this.props.children;
  }
}
