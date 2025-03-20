import type { JSX } from 'react';

import { buttonVariants, Separator, SidebarTrigger } from '@codefast/ui';

export function SiteHeader(): JSX.Element {
  return (
    <header className="h-(--header-height) group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) flex shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator className="mx-2 data-[orientation=vertical]:h-4" orientation="vertical" />
        <h1 className="text-base font-medium">Documents</h1>
        <div className="ml-auto flex items-center gap-2">
          <a
            className={buttonVariants({
              className: 'dark:text-foreground hidden sm:flex',
              size: 'sm',
              variant: 'ghost',
            })}
            href="https://github.com/codefastlabs/codefast/tree/main/apps/docs/src/registry/blocks/dashboard-01"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
