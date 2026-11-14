---
"@codefast/cli": minor
---

Commands are named `namespace:action`, as Laravel's Artisan names them, and every command runs through one model: one
`[target]`, one `--json` document, one report shape and one set of exit codes.

**Commands.** Run bare, `codefast` lists its commands and exits `0`.

| 0.15                  | 0.16                                                                         |
| --------------------- | ---------------------------------------------------------------------------- |
| `audit <name>`        | `audit:<name>` (`audit:links`, …)                                            |
| `audit display-names` | `audit:di-display-names`, reading only what uses `@codefast/di`              |
| `audit rtl`           | `audit:tailwind-rtl`, scanning the project root when no target is configured |
| `mirror`              | `exports:generate`                                                           |
| `pack-slim`           | `publish:prepare`                                                            |
| `tag`                 | `since:stamp`                                                                |
| `arrange`             | removed: oxfmt's `sortTailwindcss` already orders the classes, checked in CI |

`audit` with no name runs every audit, reports each under its name and exits with the worst outcome.

**Config.**

- `mirror` becomes `exports` and `tag` becomes `since`. `arrange` is gone, and the strict schema rejects it.
- `since` is a record keyed by package name or glob, as `exports` is: `since: { "@apps/*": false }` replaces
  `tag.skipPackages`. `exports` takes glob keys too, an exact name winning.
- `tag.onAfterWrite` becomes the top-level `afterWrite({ command, files })`, called by every command that wrote files.
- Every audit takes `audit.<name>: false | { target, allowlist }`, and `false` turns it off in a full `audit` run. The
  renamed audits read `audit.diDisplayNames` and `audit.tailwindRtl`.
- `audit:imports` holds no rules of its own and bans exactly what `audit.imports.rules` declares: each rule names a
  `module`, the forms it bans (`namespace`, `default`, `named:<name>`), an optional `scope` and `umdGlobal`, and a
  `message`. Copy the React and Zod rules it used to hardcode into your config to keep them.
- The config sits at the project root, `codefast.config.ts` and `.mts` load, and two config files there are an error.
- Types: `MirrorConfig` becomes `ExportsConfig`, `CodefastTagConfig` becomes `SinceConfig` and `CodefastAfterWriteHook`
  becomes `AfterWriteHook`; `CodefastArrangeConfig` is gone; `AuditConfig`, `AuditSection` and `ImportRule` are new.

**Running.**

- Every command takes one optional `[target]`, a file or directory inside the project root: the writing commands act on
  the packages it reaches, the audits on the files under it. A target outside the root is refused.
- Exit `1` means a failing result: findings, a failed package or a failed `afterWrite` hook. Exit `2` means the run
  could not happen: an unknown command or option, invalid config, a bad target or a crash. A script that read any
  non-zero code as findings should check for `1`.
- `-v, --verbose` on every command replaces `CODEFAST_VERBOSE`. Color honors `NO_COLOR`, `FORCE_COLOR` and a
  non-terminal stream everywhere, and a large `--json` piped on macOS is no longer cut off.
- Every audit takes `--fix`; today `audit:comments` is the one whose findings carry fixes.
- The writing commands report one outcome per package (`changed`, `unchanged`, `skipped` or `failed`, with the files
  written), printed as one row each and one summary line. `exports:generate` writes a `package.json` only when its
  content changes, and `since:stamp` stamps each package with its own version.

**`--json`.** Every command prints one document on stdout,
`{ schemaVersion: 3, command, ok, rootDir, target, elapsedSeconds, result }`, or
`{ schemaVersion: 3, command, ok: false, error: { code, message } }` when the run could not happen, which used to be
text on stderr. `rootDir` replaces `cwd`, which it never was. Diagnostics go to stderr, never into the JSON.

- An audit's `result` is `{ findings, scannedFiles, scannedPackages, allowlisted, fixedFiles }`, each finding
  `{ file, line, text, message }`, in place of the per-audit `files`, `violations`, `breakages`, `legacyImportFiles`,
  `unshipped` and `*Count` fields. A finding about a manifest points at the `package.json` line it concerns, and
  `audit:engines` keeps its `floors`.
- A full `audit` lists each audit's status under `result.audits`.
- A writing command's `result` lists its outcomes under `packages`, and `since:stamp` reports a declaration it left
  unstamped under `findings`.

Landed across #1189, #1204, #1206, #1207, #1221 and #1222.

pr: #1221
