import type { JSX } from 'react';

import Link from 'next/link';

export function SidebarLink({ href, title }: { href: string; title: string }): JSX.Element {
  return (
    <div className="space-y-2">
      <div className="px-4">
        <Link className="text-sm font-medium hover:underline" href={href}>
          {`Open ${title} in a new tab`}
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <iframe className="min-h-dvh w-full" src={href} title={title} />
      </div>
    </div>
  );
}
