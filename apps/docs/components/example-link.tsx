import { type ComponentProps, type JSX } from 'react';
import { cn } from '@codefast/ui/utils';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { formatUrl } from 'next/dist/shared/lib/router/utils/format-url';

type ExampleLinkProps = ComponentProps<typeof Link>;

export function ExampleLink({ className, ...props }: ExampleLinkProps): JSX.Element {
  const pathname = usePathname();
  const hrefString = typeof props.href === 'string' ? props.href : formatUrl(props.href);
  const isActive = pathname.startsWith(hrefString) && props.href !== '/';

  return (
    <Link
      className={cn(
        'hover:text-primary flex h-7 items-center justify-center rounded-full px-4 text-center text-sm transition-colors',
        isActive ? 'bg-muted text-primary font-medium' : 'text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
