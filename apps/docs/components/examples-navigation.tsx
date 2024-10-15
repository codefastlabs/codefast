'use client';

import { ExampleLink } from '@/components/example-link';
import { cn, ScrollArea } from '@codefast/ui';
import { type HTMLAttributes, type JSX } from 'react';

const examples: {
  href: string;
  name: string;
}[] = [
  {
    name: 'Home',
    href: '/',
  },
  {
    name: 'Authentication',
    href: '/examples/authentication',
  },
  {
    name: 'Cards',
    href: '/examples/cards',
  },
  {
    name: 'Charts',
    href: '/examples/charts',
  },
  {
    name: 'Dashboard',
    href: '/examples/dashboard',
  },
  {
    name: 'Forms',
    href: '/examples/forms',
  },
  {
    name: 'Mail',
    href: '/examples/mail',
  },
  {
    name: 'Music',
    href: '/examples/music',
  },
  {
    name: 'Playground',
    href: '/examples/playground',
  },
  {
    name: 'Slideshow',
    href: '/examples/slideshow',
  },
  {
    name: 'Tasks',
    href: '/examples/tasks',
  },
];

type ExamplesNavigationProps = HTMLAttributes<HTMLDivElement>;

export function ExamplesNavigation({
  className,
  ...props
}: ExamplesNavigationProps): JSX.Element {
  return (
    <div className={cn('relative', className)} {...props}>
      <ScrollArea size="sm">
        <div
          className={cn('flex items-center gap-1 p-2', className)}
          {...props}
        >
          {examples.map((example) => (
            <ExampleLink key={example.href} href={example.href}>
              {example.name}
            </ExampleLink>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
