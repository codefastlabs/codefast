import type { JSX } from 'react';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@codefast/ui';
import Link from 'next/link';

export function BreadcrumbDemo(): JSX.Element {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/apps/docs/public#breadcrumb">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-hidden hover:bg-secondary flex items-center gap-1 rounded-sm px-1">
              <BreadcrumbEllipsis className="size-4" />

              <span className="sr-only">Toggle menu</span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/apps/docs/public#breadcrumb">Documentation</Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/apps/docs/public#breadcrumb">Themes</Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/apps/docs/public#breadcrumb">GitHub</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/apps/docs/public#breadcrumb">Components</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
