import {
  buttonVariants,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@codefast/ui';
import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { type JSX } from 'react';

interface NavProps {
  isCollapsed: boolean;
  links: {
    icon: LucideIcon;
    title: string;
    variant: 'default' | 'ghost';
    label?: string;
  }[];
}

export function Nav({ links, isCollapsed }: NavProps): JSX.Element {
  return (
    <div
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
      data-collapsed={isCollapsed}
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) =>
          isCollapsed ? (
            // eslint-disable-next-line react/no-array-index-key -- we don't expect the links to change
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  className={cn(
                    buttonVariants({ variant: link.variant, icon: true }),
                    'size-9',
                    link.variant === 'default' &&
                      'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white',
                  )}
                  href="#"
                >
                  <link.icon className="size-4" />
                  <span className="sr-only">{link.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-4" side="right">
                {link.title}
                {link.label ? (
                  <span className="text-muted-foreground ml-auto">
                    {link.label}
                  </span>
                ) : null}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              // eslint-disable-next-line react/no-array-index-key -- we don't expect the links to change
              key={index}
              className={cn(
                buttonVariants({ variant: link.variant, size: 'sm' }),
                link.variant === 'default' &&
                  'dark:bg-muted dark:hover:bg-muted dark:text-white dark:hover:text-white',
                'justify-start',
              )}
              href="#"
            >
              <link.icon className="mr-2 size-4" />
              {link.title}
              {link.label ? (
                <span
                  className={cn(
                    'ml-auto',
                    link.variant === 'default' &&
                      'text-background dark:text-white',
                  )}
                >
                  {link.label}
                </span>
              ) : null}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
