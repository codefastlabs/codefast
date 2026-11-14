---
"@codefast/cli": minor
---

Every command now runs through one model, so they all take the same argument, print the same JSON and fail the same way.

- **One `[target]`.** Every command takes a file or directory inside the project root, resolved against the working
  directory; `exports:generate`, `publish:prepare` and `since:stamp` act on the packages it reaches, the audits on the
  files under it. A target outside the root is refused. `audit [target]` runs every audit over it.
- **One `--json` document.** Every command prints
  `{ schemaVersion: 3, command, ok, rootDir, target, elapsedSeconds, result }`, and a run that could not happen prints
  `{ schemaVersion: 3, command, ok: false, error: { code, message } }` on stdout instead of text on stderr. A full
  `audit` puts its list under `result.audits`. Diagnostics such as a skipped workspace glob go to stderr, never into the
  JSON.
- **One report shape for the writing commands.** `exports:generate`, `publish:prepare` and `since:stamp` report one
  outcome per package — `changed`, `unchanged`, `skipped` or `failed`, with the files written — and print one row per
  package and one summary line, instead of a banner, a tree or a table. `exports:generate` writes a `package.json` only
  when its content changes. `since:stamp` stamps each package with its own version and reports a declaration it left
  unstamped as a `file:line` finding.
- **One `afterWrite` hook.** `tag.onAfterWrite` becomes the top-level `afterWrite({ command, files })`, called by every
  command that wrote files; the `CodefastAfterWriteHook` type becomes `AfterWriteHook`.
- **One way to skip a package.** `since` is a record keyed by package name or glob, as `exports` is: write
  `since: { "@apps/*": false }` where `tag.skipPackages` listed globs. `exports` accepts glob keys too, the exact name
  winning.
- **One config file, at the project root.** `codefast.config.ts` and `.mts` now load as the README always said; the
  config must sit at the project root, and two config files there is an error rather than a silent pick.
- **Every audit takes `--fix`.** It applies whatever fixes that audit's findings carry; today that is `audit:comments`.
