"use client";

import { Slot } from "@radix-ui/react-slot";

import type { ComponentProps, JSX } from "react";

/* -----------------------------------------------------------------------------
 * Component: Blockquote
 * -------------------------------------------------------------------------- */

interface BlockquoteProps extends ComponentProps<"blockquote"> {
  asChild?: boolean;
}

function Blockquote({ asChild, ...props }: BlockquoteProps): JSX.Element {
  const Component = asChild ? Slot : "blockquote";

  return <Component data-slot="blockquote" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Blockquote };
export type { BlockquoteProps };
