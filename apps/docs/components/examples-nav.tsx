'use client';

import { cn } from '@codefast/ui/utils';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@codefast/ui/scroll-area';
import Link from 'next/link';
import { type HTMLAttributes, type JSX } from 'react';

const examples = [
  {
    name: 'Mail',
    href: '/examples/mail',
  },
  {
    name: 'Dashboard',
    href: '/examples/dashboard',
  },
  {
    name: 'Cards',
    href: '/examples/cards',
  },
  {
    name: 'Tasks',
    href: '/examples/tasks',
  },
  {
    name: 'Playground',
    href: '/examples/playground',
  },
  {
    name: 'Forms',
    href: '/examples/forms',
  },
  {
    name: 'Music',
    href: '/examples/music',
  },
  {
    name: 'Authentication',
    href: '/examples/authentication',
  },
  {
    name: 'Slideshow',
    href: '/examples/slideshow',
  },
];

type ExamplesNavProps = HTMLAttributes<HTMLDivElement>;

export function ExamplesNav({ className, ...props }: ExamplesNavProps): JSX.Element {
  const pathname = usePathname();

  return (
    <div className={cn('relative', className)} {...props}>
      <ScrollArea className="max-w-[600px] lg:max-w-none">
        <div className={cn('flex items-center gap-1 p-2', className)} {...props}>
          {examples.map((example, index) => (
            <Link
              key={example.href}
              className={cn(
                'hover:text-primary flex h-7 items-center justify-center rounded-full px-4 text-center text-sm transition-colors',
                pathname.startsWith(example.href) || (index === 0 && pathname === '/')
                  ? 'bg-muted text-primary font-medium'
                  : 'text-muted-foreground',
              )}
              href={example.href}
            >
              {example.name}
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
