/**
 * tv and cva infer strict literal types from configuration objects.
 * Benchmark fixtures use widened object shapes; relax typing only at this boundary.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- benchmark-only escape hatch for library generics */
import { createTV as codefastCreateTVFn, tv as codefastTv } from "@codefast/tailwind-variants";
import { cva as cvaFromLib } from "class-variance-authority";
import { createTV as tailwindCreateTVFn, tv as tailwindTv } from "tailwind-variants";

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
