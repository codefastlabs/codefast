import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BenchmarkSection } from "#/features/home/components/benchmark-section";
import type { LedgerFacts } from "#/features/home/lib/benchmark-ledger-facts";

vi.mock("#/features/tracking/lib/tracking", () => ({ track: vi.fn() }));

afterEach(() => {
  cleanup();
});

const ledger: LedgerFacts = {
  libraries: [
    { name: "@codefast/di", version: "0.8.1" },
    { name: "inversify", version: "8.2.3" },
    { name: "awilix", version: "13.0.5" },
    { name: "tsyringe", version: "4.10.0" },
  ],
  environment: "Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64",
  latestEntry: { date: "2026-09-06", title: "full re-measure on 0.8.1" },
  lastFullRemeasure: "2026-09-06",
  aggregateProfile: "BENCH_ISOLATE=true BENCH_MODE=full, one subprocess per scenario, libraries interleaved",
  aggregates: [
    { competitor: "inversify", wins: 45, parities: 0, losses: 0, median: 2.33, geomean: 2.84 },
    { competitor: "Awilix 13", wins: 8, parities: 0, losses: 0, median: 3.22, geomean: 3.77 },
    { competitor: "tsyringe 4", wins: 7, parities: 0, losses: 1, median: 6, geomean: 4.89 },
  ],
  losses: [{ scenario: "realistic-graph-cold-resolve", ratio: 0.89, competitor: "tsyringe" }],
};

describe("BenchmarkSection", () => {
  it("names @codefast/di as the subject: its record on top, every row against a competitor, ratios as speed-ups", () => {
    render(<BenchmarkSection ledger={ledger} />);

    expect(screen.getByText("60 wins · 0 parity · 1 loss")).toBeInTheDocument();
    expect(screen.getByText(/across 61 head-to-head rows/)).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "@codefast/di faster by" })).toBeInTheDocument();
    expect(screen.getAllByRole("rowheader").map((header) => header.textContent)).toEqual([
      "vs inversify 8.2.3",
      "vs awilix 13.0.5",
      "vs tsyringe 4.10.0",
    ]);
    expect(screen.getByText("6.00×")).toBeInTheDocument();
    expect(screen.getByText(/The one loss: realistic-graph-cold-resolve at 0.89× of tsyringe/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Where it loses" })).toHaveAttribute(
      "href",
      expect.stringContaining("#where-it-loses"),
    );
  });

  it("pluralises the losses and keeps the last full re-measure in the footer", () => {
    render(
      <BenchmarkSection
        ledger={{
          ...ledger,
          aggregates: [{ competitor: "inversify", wins: 40, parities: 2, losses: 3, median: 1.5, geomean: 1.4 }],
          losses: [],
        }}
      />,
    );

    expect(screen.getByText("40 wins · 2 parity · 3 losses")).toBeInTheDocument();
    expect(screen.getByText(/The 3 losses stay published/)).toBeInTheDocument();
    expect(screen.getByText("September 6, 2026")).toBeInTheDocument();
  });
});
