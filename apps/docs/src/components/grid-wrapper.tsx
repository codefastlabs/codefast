import type { ComponentProps, JSX } from 'react';

import { cn } from '@codefast/ui';

export function GridWrapper({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div className="mx-auto w-full overflow-hidden" {...props}>
      <div
        className={cn(
          '-m-px grid divide-y md:grid-cols-2 md:divide-x lg:grid-cols-3',
          '*:px-1 *:py-12 *:last:border-r *:sm:px-8 *:xl:px-12',
          className,
        )}
        {...props}
      />
    </div>
  );
}
