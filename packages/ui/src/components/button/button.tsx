import { buttonVariants } from "@/components/button/button-variants";
import { Spinner } from "@/components/spinner";

import type { VariantProps } from "@/lib/utils";
import type { ComponentProps, JSX, ReactNode } from "react";

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

interface ButtonProps extends Omit<ComponentProps<"button">, "prefix">, VariantProps<typeof buttonVariants> {
  loaderPosition?: "prefix" | "suffix";
  loading?: boolean;
  prefix?: ReactNode;
  spinner?: ReactNode;
  suffix?: ReactNode;
}

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
}: ButtonProps): JSX.Element {
  return (
    <button
      className={buttonVariants({ className, size, variant })}
      data-slot="button"
      data-variant={variant}
      disabled={loading ?? disabled}
      type="button"
      {...props}
    >
      {loading && loaderPosition === "prefix" ? (spinner ?? <Spinner />) : prefix}
      {children}
      {loading && loaderPosition === "suffix" ? (spinner ?? <Spinner />) : suffix}
    </button>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Button };
export type { ButtonProps };
