---
"@codefast/cli": minor
---

Exit codes now separate a failing result from a run that could not happen: `1` means findings, an errored package or a
failed hook; `2` means an unknown command or option, invalid config, a missing target or a crash — Commander's own usage
errors included, which used to exit `1`. Scripts that treated any non-zero code as findings should check for `1`.

`codefast audit` run with no subcommand now runs every audit over the repo root, reports each under its name and exits
with the worst outcome, so one CI step shows every failing audit; `--json` prints each audit's status, and `rtl` is
skipped when no `audit.rtl.target` is configured.

`-v, --verbose` is now a flag on every command and replaces the `CODEFAST_VERBOSE` environment variable. Color goes
through `util.styleText`, so `NO_COLOR`, `FORCE_COLOR` and a non-terminal stream are honored everywhere, and `tag` no
longer writes escape codes into a pipe. The binary sets its exit code instead of calling `process.exit`, so a large
`--json` piped on macOS is no longer cut off at 64 KiB.
