/** The one typing escape hatch: each library's `tv`, `createTV`, `cn`, and `cva` widened to `any` for the shared fixtures. */
/* eslint-disable @typescript-eslint/no-explicit-any -- benchmark-only escape hatch for library generics */
import { cn as codefastCnFn, createTV as codefastCreateTVFn, tv as codefastTv } from "@codefast/tailwind-variants";
import { cva as cvaFromLib, cx as cvaCxFn } from "class-variance-authority";
import { cn as tailwindCnFn, createTV as tailwindCreateTVFn, tv as tailwindTv } from "tailwind-variants";

/**
 * @since 0.3.16-canary.0
 */
export const tailwindVariantsTv = tailwindTv as any;
/**
 * @since 0.3.16-canary.0
 */
export const codefastTvFn = codefastTv as any;
/**
 * @since 0.3.16-canary.0
 */
export const tailwindVariantsCreateTV = tailwindCreateTVFn as any;
/**
 * @since 0.3.16-canary.0
 */
export const codefastCreateTV = codefastCreateTVFn as any;
/**
 * @since 0.3.16-canary.0
 */
export const cva = cvaFromLib as any;
/**
 * The `cn` `@codefast/tailwind-variants` exports.
 *
 * @since 0.11.1
 */
export const codefastCn = codefastCnFn as any;
/**
 * The `cn` `tailwind-variants` exports.
 *
 * @since 0.11.1
 */
export const tailwindVariantsCn = tailwindCnFn as any;
/**
 * The clsx-style join `class-variance-authority` exports, which its `cn` pairs with `tailwind-merge`.
 *
 * @since 0.11.1
 */
export const cvaCx = cvaCxFn as any;
