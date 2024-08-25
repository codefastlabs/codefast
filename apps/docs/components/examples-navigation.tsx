'use client';

import { cn } from '@codefast/ui/utils';
import { ScrollArea } from '@codefast/ui/scroll-area';
import { type HTMLAttributes, type JSX } from 'react';
import { ExampleLink } from '@/components/example-link';

const examples: {
  href: string;
  name: string;
}[] = [
  {
    name: 'Home',
    href: '/',
  },
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

type ExamplesNavigationProps = HTMLAttributes<HTMLDivElement>;

export function ExamplesNavigation({ className, ...props }: ExamplesNavigationProps): JSX.Element {
  return (
    <div className={cn('relative', className)} {...props}>
      <ScrollArea className="max-w-[600px] lg:max-w-none">
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
