#!/usr/bin/env node
/** Measures what each library adds to a browser bundle: the smallest one-variant component, minified and gzipped. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { rebuildSubjectPackage } from "@internal/benchmark-harness/parent/rebuild-subject-package";
import { runFootprintMain } from "@internal/benchmark-harness/results/footprint";

import { BENCH_LIBRARIES, CODEFAST_TV } from "#harness/config";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Each library's smallest program — one component with one variant, defined and rendered once — through its default
 * entry, so a library that merges by default ships its engine.
 */
const PROGRAMS: Readonly<Record<string, string>> = {
  "@codefast/tailwind-variants": `
    import { tv } from "@codefast/tailwind-variants";
    const button = tv({ base: "rounded px-4", variants: { size: { sm: "text-sm", lg: "text-lg" } } });
    console.log(button({ size: "sm" }));`,
  "tailwind-variants": `
    import { tv } from "tailwind-variants";
    const button = tv({ base: "rounded px-4", variants: { size: { sm: "text-sm", lg: "text-lg" } } });
    console.log(button({ size: "sm" }));`,
  "class-variance-authority": `
    import { cva } from "class-variance-authority";
    const button = cva("rounded px-4", { variants: { size: { sm: "text-sm", lg: "text-lg" } } });
    console.log(button({ size: "sm" }));`,
};

/** The engine `@codefast/tailwind-variants` merges with by default, bundled alone so its share reads off one line. */
const ENGINE_PROGRAM = `
  import { twMerge } from "cn";
  console.log(twMerge("px-2 px-4"));`;

/** The engine `cva`'s with-merge rows pair with, bundled alone for the same reason. */
const TAILWIND_MERGE_PROGRAM = `
  import { twMerge } from "tailwind-merge";
  console.log(twMerge("px-2 px-4"));`;

await runFootprintMain({
  packageRootDirectory,
  subject: CODEFAST_TV,
  libraries: BENCH_LIBRARIES,
  programs: PROGRAMS,
  extraPrograms: [
    { label: "`cn` alone", source: ENGINE_PROGRAM },
    { label: "`tailwind-merge` alone", source: TAILWIND_MERGE_PROGRAM },
  ],
  rebuild: () => rebuildSubjectPackage(CODEFAST_TV.libraryName, packageRootDirectory),
});
