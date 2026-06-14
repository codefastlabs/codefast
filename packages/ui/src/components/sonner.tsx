import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { useTheme } from "next-themes";
import type { CSSProperties, JSX } from "react";
import type { ToasterProps as SonnerToasterProps } from "sonner";
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
      className="toaster group"
      icons={{
        error: <OctagonXIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        success: <CircleCheckIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
      }}
      style={
        {
          "--border-radius": "var(--radius)",
          "--normal-bg": "var(--popover)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--popover-foreground)",
        } as CSSProperties
      }
      theme={theme as ToasterProps["theme"]}
      toastOptions={{
        classNames: {
          toast: "rounded-2xl",
        },
      }}
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
