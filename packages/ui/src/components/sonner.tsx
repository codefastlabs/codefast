"use client";

import { cn } from "#/lib/utils";
import type { CSSProperties, JSX } from "react";
import type { ToasterProps as SonnerToasterProps } from "sonner";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

/* -----------------------------------------------------------------------------
 * Component: Sonner
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ToasterProps = SonnerToasterProps;

/**
 * @since 0.3.16-canary.0
 */
function Toaster({ ...props }: ToasterProps): JSX.Element {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      className={cn("group", "toaster")}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--popover-foreground)",
        } as CSSProperties
      }
      theme={theme as ToasterProps["theme"]}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { toast, useSonner } from "sonner";
export { Toaster };
export type { ToasterProps };
