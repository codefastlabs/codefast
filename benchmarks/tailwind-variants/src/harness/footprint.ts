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
 * entry, so a library that merges with `tailwind-merge` by default ships it.
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

/** The merge both `tv()` libraries call by default, bundled alone so its share of their rows reads off one line. */
const MERGE_PROGRAM = `
  import { twMerge } from "tailwind-merge";
  console.log(twMerge("px-2 px-4"));`;

await runFootprintMain({
  packageRootDirectory,
  subject: CODEFAST_TV,
  libraries: BENCH_LIBRARIES,
  programs: PROGRAMS,
  extraPrograms: [{ label: "`tailwind-merge` alone", source: MERGE_PROGRAM }],
  rebuild: () => rebuildSubjectPackage(CODEFAST_TV.libraryName, packageRootDirectory),
});
