---
"@codefast/cli": minor
---

Every audit now reports in one shape. `--json` puts `findings` — each `{ file, line, text, message }` — under `result`,
beside `scannedFiles`, `scannedPackages`, `allowlisted` and `fixedFiles`, in place of the per-audit `files`,
`violations`, `breakages`, `legacyImportFiles`, `unshipped` and `*Count` fields. `audit:engines` keeps its `floors`
list. A finding about a manifest — an engines floor, an unshipped export — points at the `package.json` line it
concerns.

Every audit takes the same config section: `audit.<name>: false` turns it off in a full `audit` run, and
`{ target, allowlist }` names its default target and the findings it accepts, `audit:publish` and `audit:engines`
included. `audit:rtl` no longer skips itself when no target is configured; turn it off with `audit: { rtl: false }`. The
human report prints every finding as `line: text → message` under its file and ends with one summary line; `audit:rtl`
phrases a replacement as `use ms-2`. The new `AuditConfig` and `AuditSection` types describe the section.
