import type { ComponentProps, JSX, ReactNode } from "react";

import type { VariantProps } from "@/lib/utils";

import { buttonVariants } from "@/components/button/button-variants";
import { Spinner } from "@/components/spinner";

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

function Button({
  children,
  className,
  disabled,
  loaderPosition = "prefix",
  loading,
  prefix,
  size,
  spinner,
  suffix,
  variant,
  ...props
}: Omit<ComponentProps<"button">, "prefix"> &
  VariantProps<typeof buttonVariants> & {
    loaderPosition?: "prefix" | "suffix";
    loading?: boolean;
    prefix?: ReactNode;
    spinner?: ReactNode;
    suffix?: ReactNode;
  }): JSX.Element {
  return (
    <button
      className={buttonVariants({ className, size, variant })}
      data-slot="button"
      data-variant={variant}
      disabled={loading || disabled}
      type="button"
      {...props}
    >
      {loading && loaderPosition === "prefix" ? spinner || <Spinner /> : prefix}
      {children}
      {loading && loaderPosition === "suffix" ? spinner || <Spinner /> : suffix}
    </button>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Button };
