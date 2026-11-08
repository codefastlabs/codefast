/** `class-variance-authority` as its scenarios drive it; the only module its subprocess loads a library from. */
import { cva as cvaFromLib, cx as cvaCxFromLib } from "class-variance-authority";

/**
 * `cva` with its generics widened, so the shared fixtures fit it.
 */
export const cva = cvaFromLib as (
  base: unknown,
  config?: object,
) => (props?: Readonly<Record<string, unknown>>) => string;

/**
 * The clsx-style join `class-variance-authority` exports, which its `cn` pairs with `tailwind-merge`.
 */
export const cvaCx = cvaCxFromLib as (...classes: ReadonlyArray<unknown>) => string;
