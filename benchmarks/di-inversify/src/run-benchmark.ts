/**
 * Compatibility shim. The real parent harness lives at
 * `./harness/run.ts`. This file is kept only so stale `pnpm exec tsx
 * src/run-benchmark.ts` invocations (from shell history, scripts, or
 * muscle memory) still find the new entry point.
 *
 * New callers should use `pnpm bench`, which `package.json` already
 * points at `src/harness/run.ts`.
 */
import "./harness/run";
