import { cn } from '@codefast/ui/utils';
import Link from 'next/link';
import type { HTMLAttributes, JSX } from 'react';

export function MainNav({ className, ...props }: HTMLAttributes<HTMLElement>): JSX.Element {
  return (
    <nav className={cn('flex items-center space-x-4 lg:space-x-6', className)} {...props}>
      <Link href="/examples/dashboard" className="hover:text-primary text-sm font-medium transition-colors">
        Overview
      </Link>
      <Link
        href="/examples/dashboard"
        className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
      >
        Customers
      </Link>
      <Link
        href="/examples/dashboard"
        className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
      >
        Products
      </Link>
      <Link
        href="/examples/dashboard"
        className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
      >
        Settings
      </Link>
    </nav>
  );
}
