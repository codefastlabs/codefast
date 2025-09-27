import type { ComponentProps, JSX, ReactNode } from "react";

import type { VariantProps } from "@codefast/tailwind-variants";

import { buttonVariants } from "@/components/button/button.variants";
import { Spinner } from "@/components/spinner/spinner";

/* -----------------------------------------------------------------------------
 * Component: Button
 * -------------------------------------------------------------------------- */

interface ButtonProps
  extends Omit<ComponentProps<"button">, "prefix">,
    VariantProps<typeof buttonVariants> {
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
      {loading && loaderPosition === "prefix" ? (spinner ?? <Spinner key="prefix" />) : prefix}
      {children}
      {loading && loaderPosition === "suffix" ? (spinner ?? <Spinner key="suffix" />) : suffix}
    </button>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Button };
export type { ButtonProps };
