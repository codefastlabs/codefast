'use client';

import type { HTMLAttributes, JSX } from 'react';

import { cn, ScrollArea } from '@codefast/ui';

import { ExampleLink } from '@/components/example-link';

const examples: {
  href: string;
  name: string;
}[] = [
  {
    href: '/',
    name: 'Home',
  },
  {
    href: '/examples/authentication',
    name: 'Authentication',
  },
  {
    href: '/examples/cards',
    name: 'Cards',
  },
  {
    href: '/examples/charts',
    name: 'Charts',
  },
  {
    href: '/examples/dashboard',
    name: 'Dashboard',
  },
  {
    href: '/examples/forms',
    name: 'Forms',
  },
  {
    href: '/examples/mail',
    name: 'Mail',
  },
  {
    href: '/examples/music',
    name: 'Music',
  },
  {
    href: '/examples/playground',
    name: 'Playground',
  },
  {
    href: '/examples/slideshow',
    name: 'Slideshow',
  },
  {
    href: '/examples/tasks',
    name: 'Tasks',
  },
  {
    href: '/examples/sidebars',
    name: 'Sidebars',
  },
];

type ExamplesNavigationProps = HTMLAttributes<HTMLDivElement>;

export function ExamplesNavigation({ className, ...props }: ExamplesNavigationProps): JSX.Element {
  return (
    <div className={cn('relative', className)} {...props}>
      <ScrollArea size="sm">
        <div className={cn('flex items-center gap-1 p-2', className)} {...props}>
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
