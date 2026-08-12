---
"@codefast/benchmark-harness": minor
---

Replace the `BENCH_FAST`/`BENCH_FULL` flag pair with `BENCH_MODE`, and parse every on/off key strictly.

The suite's env surface spelled two different things the same way: `BENCH_TRIALS=3` meant three trials, `BENCH_FAST=1`
meant true. Reading a manifest could not tell them apart, and every flag was read as `process.env[key] === "1"`, so
`BENCH_FAST=true`, `=yes`, `=on`, or a value carrying whitespace from a CI file all evaluated to false with no warning —
the harness ran a profile nobody asked for and nothing downstream could tell that from a real measurement.
`BENCH_TRIALS` and `BENCH_ONLY` already reported bad input; the booleans were the only keys that failed quietly.

On/off keys now accept `1`, `true`, `yes` or `on` in any case and throw on anything else instead of reading it as off.
The timing profile is `BENCH_MODE=fast|default|full`: one key with three values, where a flag per profile could express
a both-on state that has no meaning and needed a documented tiebreak. `BENCH_FAST` and `BENCH_FULL` are no longer read
and now throw pointing at their replacement, rather than being an env var that sets nothing while looking like it
selected a profile.

The repo's Turbo config also ran in strict env mode without listing `BENCH_ONLY` or `BENCH_ISOLATE` in `passThroughEnv`,
so both were dropped for any run started from the root — `BENCH_ONLY=<id> pnpm bench:isolate`, the single-row recipe in
`BENCH_GUIDE.md`, silently benched the entire suite. Both keys now pass through.
