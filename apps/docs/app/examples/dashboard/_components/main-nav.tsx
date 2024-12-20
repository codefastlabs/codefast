import type { HTMLAttributes, JSX } from 'react';

import { cn } from '@codefast/ui';
import Link from 'next/link';

export function MainNav({ className, ...props }: HTMLAttributes<HTMLElement>): JSX.Element {
  return (
    <nav className={cn('flex items-center space-x-4 lg:space-x-6', className)} {...props}>
      <Link className="hover:text-primary text-sm font-medium transition-colors" href="/examples/dashboard">
        Overview
      </Link>
      <Link
        className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
        href="/examples/dashboard"
      >
        Customers
      </Link>
      <Link
        className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
        href="/examples/dashboard"
      >
        Products
      </Link>
      <Link
        className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
        href="/examples/dashboard"
      >
        Settings
      </Link>
    </nav>
  );
}
