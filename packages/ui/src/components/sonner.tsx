import * as React from 'react';
import { useTheme } from 'next-themes';
import { toast, Toaster as Sonner } from 'sonner';

/* -----------------------------------------------------------------------------
 * Component: Sonner
 * -------------------------------------------------------------------------- */

type ToasterProps = React.ComponentProps<typeof Sonner>;
type Theme = 'light' | 'dark' | 'system' | undefined;

function Toaster({ ...props }: ToasterProps): React.JSX.Element {
  const { theme = 'system' } = useTheme() as { theme: Theme };

  return (
    <Sonner
      className="toaster group"
      theme={theme}
      toastOptions={{
        classNames: {
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          content: 'w-full flex flex-col gap-1',
          description: 'group-[.toast]:text-muted-foreground',
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        },
      }}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Toaster, toast, type ToasterProps };
