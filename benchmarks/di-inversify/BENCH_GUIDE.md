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

1. Put the two builds where the bench can reach them. **Two mechanisms work, and which one you pick
   decides which runner you may use in step 2** — see the table below.
2. For each scenario, run **one subprocess per side, back to back**, and record the ratio.
3. Repeat for at least three passes, **swapping which side goes first each pass**.
4. Report the median of the per-pass ratios, and show them all.

Step 2 means **one subprocess per (side, scenario)**. Both runners below give you that; what they do
not share is what they do to the build first, and pairing them wrong fails _silently_.

| Step 1 mechanism                                                                | Step 2 runner                                                            | Why that pairing                                                                                                                                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Swap the source** — checkout, stash or patch `packages/di/src` per side       | `bench:isolate`                                                          | `src/harness/run.ts` calls `rebuildCodefastDiPackage()` before it spawns anything, and that rebuild is exactly what makes the swap take effect                                            |
| **Swap the build** — two prebuilt dirs, copied over `packages/di/dist` per side | `BENCH_ONLY=<id>` on a child entry: `bench:codefast` / `bench:inversify` | The same rebuild would overwrite `packages/di/dist` from `src` before the first sample, so both sides measure HEAD and **every row reports parity** — an A/B that never compared anything |

Swapping the build is faster and is the only option when the two builds are not both reachable from
the working tree. Whichever you use, `bench`, `bench:fast`, `bench:full` and `bench:verbose` are all
`run.ts` too, and none of them isolates per scenario — so they are wrong here for a second reason.

Running a side's whole suite in one process is not a cheaper version of the same measurement either:
scenarios that share an isolate share inline caches and optimisation state, so a change to a function
several rows exercise shows up compressed. A whole-suite paired A/B once read a change as a clean win
whose real cost, measured per-scenario, was 0.87×–0.93× on three rows — and mis-blamed two
neighbouring commits before the isolation was added.

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

### Measure the floor before you set the threshold

A "must not regress" threshold is only meaningful above the row's own noise. Get that number the
same way you get everything else here — **run the harness against itself**: copy the baseline build
into both slots and run the identical paired procedure. Whatever spread comes back is what that row
cannot distinguish, on this machine, today.

It is not small, and it is not uniform. An A/A run over this suite put the fastest rows —
`slot-tag-array-hoisted`, `tagged-binding-resolve`, `named-constant-get`, all above 20 M ops/s — at
per-pass swings of **±12%**, one of them **±20%**, with medians landing as far out as 1.028×. The
slower rows in the same run sat inside **±3%**. Faster row, noisier ratio: the work per sample
shrinks while the timer's error does not.

So a threshold of 0.98× on a ±12% row is not strict, it is meaningless — it will fire on noise
about as often as it fires on a regression, and it fired exactly that way here, rejecting a change
on two rows the change could not reach. Two defences, and the first is worth more:

- **Ask whether a causal path exists at all.** A row that never executes the changed function cannot
  have regressed because of it, and no amount of re-running turns that into evidence. Say which rows
  those are before measuring, not after seeing the number you dislike.
- **Set each must-hold threshold from that row's measured A/A spread**, not from a round number. A
  round number encodes how strict you feel, not what the instrument can see.

## Comparing two libraries: interleave, and say you did

Run every library on the **same scenario** before moving to the next, rotating which library goes
first. `bench:isolate` does exactly that, and the report's Environment section names the policy it
used — so a cross-library figure from an isolated run is citable, and one from the plain profile is
not, because there one process per library runs that library's whole suite and there is nothing to
interleave.

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

- **Three trials minimum where a median is claimed.** The default and `BENCH_FULL` profiles run 3
  trials, and `BENCH_TRIALS=1` is rejected with a warning and the default restored — a median of two
  samples is their mean, and cannot separate a change from noise. `BENCH_FAST` runs **one** trial: it
  is a smoke profile, answering "does it run and roughly how fast", never a citable number.
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
- **Check which side of a trade is comparable before taking it.** A row with `excludeFromAggregates`,
  or one no other library implements, contributes to no published figure — a win there does not pay
  for a loss on one of the head-to-head rows.
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
