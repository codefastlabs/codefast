"use client";

import type { CSSProperties, JSX } from "react";
import type { ToasterProps } from "sonner";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

/* -----------------------------------------------------------------------------
 * Component: Sonner
 * -------------------------------------------------------------------------- */

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
