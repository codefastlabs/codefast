# How to measure so the number survives

The standard a figure has to meet before it goes in [`RESULTS.md`](./RESULTS.md), a package's
`ARCHITECTURE.md`, or a commit message. Every rule here exists because a measurement that skipped it
produced a confident number that later turned out to be wrong.

## The two questions are different, and so are the methods

**"Did my change make this faster?"** compares two builds of the same library. Nothing else may
differ, and both builds must run in the same time window.

**"Are we faster than library X?"** compares two libraries. Their versions, their decorator modes and
their heaps all differ by construction, so the only thing you can defend is a ratio measured with both
sides interleaved.

Answering the first question with a cross-library ratio is the most common way to be wrong here. A
ratio moves when the competitor's version changes, when the machine warms up, or when the runner
schedules one side later — none of which is your change.

## Comparing two builds: paired, alternating, best-of

1. Build the baseline and the candidate into two directories.
2. For each scenario, run **one subprocess per side, back to back**, and record the ratio.
3. Repeat for at least three passes, **swapping which side goes first each pass**.
4. Report the median of the per-pass ratios, and show them all.

Swapping the order is what makes drift cancel instead of accumulate. Reporting every pass is what
lets a reader see a pass that disagrees — if pass 2 says 0.81 and the rest say 0.99, that is worth
knowing, and a lone median hides it.

Two things this catches that a before/after comparison cannot:

- **Machine drift between runs.** Two consecutive runs of the same build on a quiet machine have moved
  a single high-throughput row by 39%. A cross-build comparison without an in-run control once
  reported a clean +4% that was entirely drift.
- **An unrelated regression.** Measure the rows your change cannot touch alongside the ones it should.
  Three "obviously faster" changes in this repo were reverted because a row they had no business
  affecting moved: collapsing a memoised accessor into an inlinable expression cost ~6% on a row that
  only reads the memo, and removing a fast lane that looked like duplication cost ~24% elsewhere.

## Comparing two libraries: interleave, and say you did

Run every library on the **same scenario** before moving to the next, rotating which library goes
first. The suite's own runner does not do this yet (see the README's known limitation), so a published
cross-library figure comes from a targeted interleaved run, not from a suite table.

Also required for a comparison to mean anything:

- **Each library in its canonical mode.** Forcing a library into another's decorator model measures
  the adapter.
- **The same profile on both sides.** `--expose-gc` changes what is being measured; the report header
  prints it per library, and all four must agree.
- **The same workload, enforced by code.** `src/fixtures/scenario-parity.ts` holds each scenario's id,
  group, description and batch factor once and both sides import it. When adding a scenario, put the
  shared constants there — a batch factor that drifts scales `hzPerOp` silently.
- **The same observable outcome.** Every scenario declares a `sanity()` check that asserts the work
  actually happened — the hook fired, the instance count matched. A scenario that is fast because it
  did less is not a win.

## What the harness enforces so you cannot forget

- **Three trials minimum, in every profile.** `BENCH_TRIALS=1` is rejected with a warning and the
  default restored. A median of two samples is their mean, and cannot separate a change from noise.
- **Batching for sub-µs work.** `batched(factor, op)` and the scenario's `batch` field must agree; the
  reporter multiplies by it. Timing an 11 ns call one at a time made a control read 0.88×; batched, the
  same control read 1.02×.
- **Instability flags in the output.** `†` marks rows above ~30M ops/s whose ratio moves between runs
  of the same build; `‡` marks cells whose per-trial IQR exceeded 5%.
- **No benchmark numbers in source comments.** A unit test in `packages/di` fails on them. A number in
  a comment cannot be re-verified where it sits and the method behind it is not there either. Numbers
  live with their method: this file, `RESULTS.md`, an `ARCHITECTURE.md`, or the commit.

## Interpreting what you get

- **Cite the median and geomean over the suite**, not a row. Averaging dozens of scenarios cancels
  most per-row noise.
- **Distrust anything above ~30M ops/s at the 10% level.** Those rows have swung 39% between
  consecutive runs of one build.
- **The rows worth reading closely sit below ~15M ops/s**: the realistic graph, the fan-out tree, the
  async chains, the `production/*` group.
- **A ratio near 1.00× is parity, not a win.** The report's bands are win >1.03×, parity 0.97–1.03×,
  loss <0.97×.
- **IQR is within-run stability and is blind to between-run variance.** Two runs have reported the same
  row as one of the tightest in the suite while disagreeing with each other by 39%.

## Before publishing a figure

- Is it a paired same-build measurement, or an interleaved cross-library one? Say which.
- How many passes, and what were they? Publish the spread, not just the median.
- What else did you measure that should **not** have moved?
- Which profile, which trial count, which library versions? The report header has all four; copy them.
- Does the claim survive a re-run tomorrow? If nobody has checked, say that too.

## Losses stay published

A page that reports only wins tells a reader nothing about the ones it left out. Where this library
loses, or is at parity, or is slower **by a deliberate trade**, the row and the reason belong in
`RESULTS.md` next to the wins — and a claim that a better measurement contradicts gets retracted in
place, not quietly dropped.
