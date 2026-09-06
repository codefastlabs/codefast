---
"@codefast/benchmark-harness": minor
"@codefast/benchmark-di-inversify": patch
"@codefast/benchmark-tailwind-variants": patch
---

`bench:serve` now honours the generic `PORT` variable when `BENCH_PORT` is unset, before falling back to the suite's
default port. A launcher that assigns a free port and announces it through `PORT` — the Claude Code Browser pane with
`autoPort`, a PaaS — finds the viewer on that port instead of on one the suite chose for itself; `BENCH_PORT` stays the
explicit override. The harness exposes the precedence as `resolvePreferredPortFromEnvironment(defaultPort)` and the
`PORT_ENV_KEY` constant, and Turbo passes `PORT` through to `bench:serve`.
