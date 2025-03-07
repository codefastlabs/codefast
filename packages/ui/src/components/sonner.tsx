'use client';

import type { JSX } from 'react';
import type { ToasterProps } from 'sonner';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

/* -----------------------------------------------------------------------------
 * Component: Sonner
 * -------------------------------------------------------------------------- */

function Toaster({ ...props }: ToasterProps): JSX.Element {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      className="toaster group"
      theme={theme as ToasterProps['theme']}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium',
        },
      }}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { toast, type ToasterProps } from 'sonner';

export { Toaster };
