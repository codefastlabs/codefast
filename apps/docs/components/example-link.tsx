import type { ComponentProps, JSX } from 'react';

import { cn } from '@codefast/ui';
import { formatUrl } from 'next/dist/shared/lib/router/utils/format-url';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type ExampleLinkProps = ComponentProps<typeof Link>;

export function ExampleLink({ className, ...props }: ExampleLinkProps): JSX.Element {
  const pathname = usePathname();
  const hrefString = typeof props.href === 'string' ? props.href : formatUrl(props.href);
  const isActive = pathname.startsWith(hrefString) && props.href !== '/';

  return (
    <Link
      className={cn(
        'flex h-7 items-center justify-center rounded-full px-4 text-center text-sm transition',
        isActive
          ? 'bg-primary text-primary-foreground font-medium'
          : 'hover:text-secondary-foreground hover:bg-secondary',
        className,
      )}
      {...props}
    />
  );
}
