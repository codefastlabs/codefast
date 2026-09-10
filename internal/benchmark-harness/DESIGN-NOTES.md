# Design notes — benchmark system redesign

> **What this document is.** A forward-looking proposal, dated 2026-09-10, for the `benchmarks/*` suites, the shared
> harness, and the results viewer. Unlike an `ARCHITECTURE.md` — which states _what the shape is and what it guarantees_
> — this note states _what the shape should become_ and why. It exists to drive a small sequence of PRs; once those
> land, the settled parts move into `README.md`/`ARCHITECTURE.md` and this note is trimmed to the still-open questions.
>
> Every claim below is grounded in a source path you can open. No figures live here — a cost claim belongs with the
> method that produced it, in a suite's `RESULTS.md`.

## The one root cause

Four separate complaints share a single design gap:

> The system **has not separated its source of truth from its derivations**, and its **comparison model has only one
> axis** (library-vs-library), while the **identity of a single measurement is missing dimensions** (the run
> configuration, and the intra-library comparison axis).

Every symptom below is that gap seen from a different angle. Fixing them one file at a time is a patch; fixing the model
is the root.

## The target model

```
SOURCE OF TRUTH  (written to disk — the only thing persisted per run)
  observations.jsonl  = raw trials: (library × scenario × trial) → hz, p75/p99, samples…
        each row stamped with the FULL identity of the measurement:
          env    = cpuModel | nodeVersion | v8 | arch | nodeOptions
          config = isolated | mode | trialCount          ← MISSING TODAY
          scenario = id | group | batch | facets

DERIVATIONS  (pure functions — produced ON DEMAND, never persisted alongside)
  ├─ comparison document (ratios, reliability markers)   ← buildComparisonDocument
  │     ├─ axis A: cross-library   (primary ÷ competitor)      ← exists today
  │     └─ axis B: intra-library   (sibling ÷ baseline)        ← MISSING TODAY
  ├─ report.md                                           ← renderComparisonMarkdownReport
  └─ history view (time-series, KPIs, group overlay)     ← the viewer

  sliced along (env × config × library × group × scenario)
```

The rule the model enforces: **persist only what cannot be recomputed (the raw trials); generate everything else on
demand from one shared function.**

## The four problems

<a id="p1-combinatorial-space"></a>

### P1 — The run space is a combination, not a flat list

Two independent axes multiply, plus continuous modifiers:

- **Execution shape** — `shared` / `isolated` (`BENCH_ISOLATE`): one child per library vs one child per scenario. Only
  `isolated` yields order-independent, citable cross-library ratios.
- **Timing profile** — `fast` / `default` / `full` (`BENCH_MODE`): `fast` is a one-trial smoke run with no median;
  `full` adds `--expose-gc` for stability.
- **Modifiers** — `BENCH_TRIALS` (turns the profile's trial count continuous), `BENCH_ONLY` (narrows to a row subset).
- **A separate kind of measurement** — `instrument:alloc` measures memory allocation, not throughput.

The full surface and its parsers live in [`src/shared/env-keys.ts`](./src/shared/env-keys.ts). The load-bearing
consequence: `isolated × fast` is a dead cell (isolation buys order-independent medians; `fast` has no median). The
pairs worth naming are `isolated + full` (citable) and `shared + fast` (smoke). This is the mental model the other three
problems build on: **one run is one point in this space, so its identity has to travel with its data.**

<a id="p2-viewer-mixes-configs"></a>

### P2 — The viewer overlays incomparable configs on one line

**Root:** the config identity is computed and written into `report.json` (`run.mode` / `run.isolated` /
`run.trialCount`, see [`src/report/comparison-document.ts`](./src/report/comparison-document.ts)) — but the history
viewer never reads `report.json`. It reads only `observations.jsonl`
([`payload.ts`](../benchmark-viewer/src/server/payload.ts)), and a JSONL row carries no config identity: the flattener
in [`src/report/write.ts`](./src/report/write.ts) builds each row from the fingerprint plus the scenario result, so
`gcExposed`/`nodeOptions` distinguish `full` but nothing distinguishes `fast` from `default`, and `isolated` is absent
entirely.

So every run of every config is concatenated into one time-series per (scenario, library). The large swing a reader sees
is the chart **correctly** plotting measurements that were never comparable — a one-trial smoke point sitting on the
same line as a GC-stabilised isolated point. It must not be smoothed; the incomparable runs must be split.

**Fix:** stamp `isolated` / `mode` / `trialCount` and a derived `configKey` onto each JSONL row, then let the viewer
partition by `configKey` exactly as it already partitions by `envKey` — the machinery exists: an environment filter and
a "Multiple environments in history" banner in [`app.tsx`](../benchmark-viewer/src/app/components/app.tsx) and the run
filter in [`use-derived-payload.ts`](../benchmark-viewer/src/app/hooks/use-derived-payload.ts), with view state already
URL-hash encoded in [`hash.ts`](../benchmark-viewer/src/app/lib/hash.ts). The true series identity becomes
`(envKey × configKey)`; the default view filters to the newest run's config.

<a id="p3-no-intra-library-model"></a>

### P3 — Comparing a library's own features has no model

**Root:** the harness only knows _pivot-vs-competitors_. Comparing features **within** one library (a `simple` group vs
a `complex` group, a cached path vs an uncached one) is currently assembled from `group` + `facets` plus a "overlay
every row of a group on one chart" presentation step — which is a chart, not a comparison: no baseline, no ratio between
sibling rows, no reliability marker on an intra-library ratio. The scenario model in
[`src/child/bench-scenario.ts`](./src/child/bench-scenario.ts) has `group`/`facets`/`batch` but no `baseline`; in
[`benchmarks/tailwind-variants`](../../benchmarks/tailwind-variants/src/fixtures/scenario-parity.ts) each `group` is
just a cross-library pair.

**Fix:** promote "comparison axis" to a first-class concept with two modes over the **same** aggregates:

- _cross-library_ (today): fix the row, ratio = primary ÷ competitor.
- _intra-library_ (new): fix the library, let a scenario declare `comparesWithin: "<group>"` to join a comparison set,
  and compute ratio = sibling ÷ baseline — reusing the identical ratio-and-reliability machinery in
  [`src/report/comparison.ts`](./src/report/comparison.ts). Which sibling is the baseline is a PR #4 detail.

An intra-library ratio composes with P2: it is only citable under `isolated + full`.

<a id="p4-artifact-dry"></a>

### P4 — The run artifacts duplicate each other

**Root:** derivations are persisted next to the source, then copied.

- `report.md` is a pure render of `report.json` — a derivation.
- `report.json` is a pure aggregation of `observations.jsonl` — a derivation whose only stated reason to exist is being
  diffable ([`src/report/write.ts`](./src/report/write.ts)).
- `latest.{md,json,jsonl}` are byte-for-byte copies of the newest whole-suite run
  ([`src/parent/bench-run-artifacts.ts`](./src/parent/bench-run-artifacts.ts)).

`bench-results/` is git-ignored and **no CI job or script consumes these files** — only a hand-authored
[`RESULTS.md`](../../benchmarks/di/RESULTS.md) and the viewer.

**Fix (note the correction of the obvious instinct):** the single file to keep is **`observations.jsonl` — the source**,
not `report.json`. Dropping the JSONL would lose the per-trial IQR the history bands need and cannot be recomputed.

1. Each run writes exactly one file, `observations.jsonl`; drop `report.json` and `report.md` from the run directory.
2. Replace the three-file `latest.*` mirror with a single one-line `latest.json` holding `{ runId }` that points at the
   newest whole-suite run directory.
3. **Precondition, before removing the markdown:** teach the viewer to render the comparison and offer **Download
   `report.md` / `report.json`**, reusing `buildComparisonDocument` and `renderComparisonMarkdownReport` (both already
   exported and already driven by [`benchmarks/di/src/harness/run.ts`](../../benchmarks/di/src/harness/run.ts)); add a
   `bench:report <runDir>` command for the `RESULTS.md` authoring flow, which _generates_ the file rather than reading a
   stored one.

## Why the four fixes reinforce each other

- [P2](#p2-viewer-mixes-configs) (stamp config into JSONL) removes `report.json`'s reason to exist, unblocking
  [P4](#p4-artifact-dry) — dropping it loses nothing, because the `run` block now lives in the JSONL rows.
- [P4](#p4-artifact-dry) (derive on demand) makes generating a report **per `(env, config, axis)` cell** free, which
  serves both [P2](#p2-viewer-mixes-configs) and [P3](#p3-no-intra-library-model).
- [P3](#p3-no-intra-library-model) (baseline axis) is a second mode of the same comparison machine and composes with
  [P2](#p2-viewer-mixes-configs)'s config partition.
- [P1](#p1-combinatorial-space) is the mental model underneath: a run is a point in the combination space, so its
  identity must travel with its data.

## Proposed sequence

Each PR is independently verifiable. Batches 1–3 are **implemented** on `feat/bench-config-identity`; batch 4 (P3)
remains.

| #   | PR                                  | Content                                                                                                    | Status |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ |
| 1   | harness: **stamp config**           | `isolated`/`mode`/`trialCount` on every JSONL row (required), shared shape resolver                        | done   |
| 2   | viewer: **partition**               | filter by `configKey` symmetric with `envKey`, default to the newest config, multi-config banner           | done   |
| 3   | harness + suites + viewer: **P4**   | one `observations.jsonl` per run + `latest.json` pointer; `bench:report` and serve download derive md/json | done   |
| 4   | harness + suites: **baseline axis** | scenario `comparesWithin: "<group>"`, within-group ratio; migrate tailwind-variants groups onto it         | to do  |

Per-PR verification: `pnpm build:packages` (so the viewer sees the harness's new types) → the harness unit tests → a
live `pnpm di:bench:isolate` and `pnpm di:bench:serve`.

## Decisions (locked 2026-09-10)

1. **`latest` pointer form** — a one-line `latest.json` = `{ runId }`. Safe on every filesystem and in git; costs one
   extra read to resolve. No data is copied.
2. **`report.json`** — dropped entirely; the comparison document and the markdown are derived on demand (in the viewer
   and via `bench:report`). Nothing aggregated is persisted next to the trials.
3. **Intra-library comparison** — declared with `comparesWithin: "<group>"` on a scenario, naming the comparison set
   explicitly rather than overloading the scenario's own `group` field. How the baseline row inside that set is chosen
   is a PR #4 detail, resolved when that axis is built.
4. **`bench:report` home** — the shared harness, beside `buildComparisonDocument` / `renderComparisonMarkdownReport`,
   exposed as a per-suite script alongside `bench:list` / `bench:serve`.
