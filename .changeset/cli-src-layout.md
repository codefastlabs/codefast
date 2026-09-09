---
"@codefast/cli": patch
---

Reorganize the CLI source into a uniform per-command and per-subcommand directory layout. Each command follows one
skeleton (`command.ts`, `cli-schema.ts`, `prepare.ts`, `run*.ts`, `output.ts`, `cli-result.ts`, `domain/`), and every
`audit`/`arrange` subcommand is now its own mini-command directory (`audit/rtl/`, `arrange/inspect/`, …) with the shared
runner and grouping engine kept at the command root. Internal refactor only — no public API or behavior change.
