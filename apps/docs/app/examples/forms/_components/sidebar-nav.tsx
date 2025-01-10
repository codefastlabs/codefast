'use client';

import type { HTMLAttributes, JSX } from 'react';

import { buttonVariants, cn } from '@codefast/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarNavProps extends HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps): JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      className={cn('flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1', className)}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          className={buttonVariants({
            className: [
              pathname === item.href ? 'bg-muted hover:bg-muted' : 'hover:bg-muted/70',
              'justify-start',
            ],
            variant: 'ghost',
          })}
          href={item.href}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
