import { buildComparisonDocument } from "#report/comparison-document";
import type { ComparisonDocument } from "#report/comparison-document";
import type { ResultsNotes } from "#results/notes";
import type { ResultsSuite } from "#results/suite";
import { library, scenario } from "#tests/unit/report/support/fixtures";

/** The one competitor every results fixture compares against. */
export type FixtureCompetitor = "rival";

const SUBJECT = {
  libraryName: "@codefast/subject",
  scenarioName: "subject",
  tsconfigFileName: "tsconfig.json",
  benchEntryFileName: "subject-benches.ts",
};

const RIVAL = {
  libraryName: "rival",
  scenarioName: "rival",
  tsconfigFileName: "tsconfig.json",
  benchEntryFileName: "rival-benches.ts",
  displayName: "Rival 1",
} as const;

/** A baseline where the subject loses `slow-row`, wins `fast-row` and alone runs `solo-row`. */
export function fixtureDocument(): ComparisonDocument {
  const pivot = library("@codefast/subject", [
    scenario("slow-row", 1_000_000),
    scenario("fast-row", 2_000_000),
    scenario("solo-row", 1_000_000, "micro", { excludeFromAggregates: true }),
  ]);
  const rival = library("Rival 1", [scenario("slow-row", 2_000_000), scenario("fast-row", 1_000_000)]);
  return buildComparisonDocument(pivot, [rival], {
    runId: "2026-10-18T00-00-00-000Z",
    runOrder: "interleaved",
    shape: { isolated: true, mode: "full" },
  });
}

/** Notes that cover the fixture's one loss and quote its win. */
export const COVERING_NOTES: ResultsNotes<FixtureCompetitor> = {
  userFacingNotes: [
    {
      title: "One call",
      lead: "A single call.",
      rows: [{ id: "fast-row", versus: ["rival"] }],
      body: "Read it whole.",
    },
  ],
  bundleNote: "The engine is most of it.",
  lossNotes: [
    {
      title: "The slow row",
      kinds: ["real deficit"],
      losses: [{ id: "slow-row", versus: ["rival"] }],
      context: [],
      body: "The subject does more per call.",
    },
  ],
};

/** A suite over the fixture, with the given notes. */
export function fixtureSuite(notes: ResultsNotes<FixtureCompetitor> = COVERING_NOTES): ResultsSuite<FixtureCompetitor> {
  return {
    directory: "benchmarks/subject",
    benchGuide: "../di/BENCH_GUIDE.md",
    subject: SUBJECT,
    competitors: [RIVAL],
    notes,
    copy: {
      coverage: "a `—` is a row the rival lacks.",
      environment: "Every library runs its default entry.",
      userFacingIntro: "These rows lead.",
      bundleLead: (bundler) => `Bundled with ${bundler}.`,
      subjectOnlyRows: "Rows with no ratio are controls.",
      excludedReason: "they are controls.",
      listing: "`pnpm bench:list` lists the rows.",
    },
    assemble: () => fixtureDocument(),
  };
}
