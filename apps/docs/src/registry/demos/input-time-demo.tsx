import type { ComponentProps, JSX } from 'react';

import { cn } from '@codefast/ui';

export function InputTimeDemo({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div className={cn('', className)} {...props}>
      Coming soon
    </div>
  );
}
