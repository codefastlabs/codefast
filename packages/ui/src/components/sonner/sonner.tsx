"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

import type { CSSProperties, JSX } from "react";
import type { ToasterProps as SonnerToasterProps } from "sonner";

/* -----------------------------------------------------------------------------
 * Component: Sonner
 * -------------------------------------------------------------------------- */

type ToasterProps = SonnerToasterProps;

function Toaster({ ...props }: ToasterProps): JSX.Element {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
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
