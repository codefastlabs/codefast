import type { ComponentProps, JSX } from 'react';

import { cn } from '@codefast/ui';
import { useMemo } from 'react';

type PlaceholderGridProps = ComponentProps<'div'>;

export function PlaceholderGrid({ className, ...props }: PlaceholderGridProps): JSX.Element {
  const uuids = useMemo(() => Array.from({ length: 24 }, () => crypto.randomUUID()), []);

  return (
    <div className={cn('', className)} {...props}>
      {uuids.map((uuid) => (
        <div key={uuid} className="bg-muted/50 aspect-video h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}
