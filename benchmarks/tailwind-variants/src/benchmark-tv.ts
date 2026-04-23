/**
 * TV and CVA infer strict literal types from configuration objects.
 * Benchmark fixtures use widened object shapes; relax typing only at this boundary.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- benchmark-only escape hatch for library generics */
import { createTV as codefastCreateTVFn, tv as codefastTv } from "@codefast/tailwind-variants";
import { cva as cvaFromLib } from "class-variance-authority";
import { createTV as tailwindCreateTVFn, tv as tailwindTv } from "tailwind-variants";

export const originalTV = tailwindTv as any;
export const codefastTV = codefastTv as any;
export const originalCreateTV = tailwindCreateTVFn as any;
export const codefastCreateTV = codefastCreateTVFn as any;
export const cva = cvaFromLib as any;
