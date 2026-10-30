import type { CSSProperties } from "react";

import { fmtHz, fmtHzCompact } from "#app/lib/format";
import type { MetaItem, MetricCardProps, MetricsResult } from "#app/lib/metrics";
import { cn, tv } from "#app/lib/utils";
import type { EmbeddedScenarioSeries } from "#types";

const iqrValue = tv({
  base: "shrink-0 font-mono tracking-[-0.02em] tabular-nums",
  variants: {
    severity: {
      ok: "text-bh-ink-mid",
      noisy: "text-amber-300/90",
      high: "text-red-300/95",
    },
  },
});

interface MetricsPanelProps {
  currentScenario: EmbeddedScenarioSeries | null;
  runIndices: Array<number>;
  metricsData: MetricsResult | null;
}

const chip = tv({
  base: "text-bh-caption inline-flex items-center rounded-full px-[0.65rem] py-[0.15rem] font-medium",
  variants: {
    variant: {
      warn: "border-bh-warn-border bg-bh-warn-bg text-bh-warn-fg border",
      ok: "border-bh-ok-border bg-bh-ok-bg text-bh-ok-fg border",
    },
  },
});

function renderMetaItem(item: MetaItem) {
  switch (item.type) {
    case "range":
      return (
        <span
          className="font-mono tracking-[-0.02em] tabular-nums"
          title={`Range ${fmtHz(item.minHz)} … ${fmtHz(item.maxHz)} hz/op`}
        >
          Range {fmtHzCompact(item.minHz)} … {fmtHzCompact(item.maxHz)}
        </span>
      );
    case "text":
      return item.value;
    case "fine-text":
      return <span className="text-bh-caption leading-[1.45] opacity-90">{item.value}</span>;
    case "ratio-paired":
      return (
        <>
          Median of per-run ratios ·{" "}
          <span className="text-bh-ink-strong font-mono tracking-[-0.02em] tabular-nums">{item.value}×</span>
        </>
      );
    case "iqr-table":
      return (
        <div className="mt-[0.28rem] flex flex-col gap-[0.42rem]">
          {item.rows.map((row) => (
            <div
              className="text-bh-caption flex items-baseline justify-between gap-3 leading-[1.35] tracking-[-0.012em]"
              key={row.libName}
            >
              <span className="text-bh-label min-w-0">{row.libName}</span>
              <span className={iqrValue({ severity: row.severity })}>{row.iqrLabel}</span>
            </div>
          ))}
        </div>
      );
  }
}

/**
 * Renders the selected scenario's metric cards with its scenario chip and footnote.
 *
 * @since 0.3.16-canary.1
 */
export function MetricsPanel({ currentScenario, runIndices, metricsData }: MetricsPanelProps) {
  return (
    <section
      aria-live="polite"
      className="border-bh-border bg-bh-surface mt-8 mb-8 rounded-2xl border px-4 py-4 shadow-(--shadow-bh-glass-tight) backdrop-blur-xl backdrop-saturate-180 sm:mt-10 sm:px-6 sm:py-5"
      id="summary"
    >
      <div className="flex flex-wrap items-baseline gap-2 gap-y-1">
        <h2 className="text-bh-label text-bh-caption font-semibold tracking-[0.14em] uppercase">
          Selected scenario metrics
        </h2>
        {currentScenario && runIndices.length > 0 && (
          <span className={chip({ variant: metricsData?.hasHighDispersion ? "warn" : "ok" })}>
            [{currentScenario.group}] {currentScenario.id}
          </span>
        )}
      </div>
      {currentScenario?.what && (
        <p className="text-bh-small mt-2 leading-relaxed text-zinc-400">{currentScenario.what}</p>
      )}
      <div className="mt-5 grid grid-cols-[1fr] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]">
        {metricsData?.cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
      {metricsData?.footnote && (
        <p className="text-bh-small text-bh-label-muted mt-3 leading-relaxed">{metricsData.footnote}</p>
      )}
    </section>
  );
}

function MetricCard({ label, value, meta, accentColor, isRatio }: MetricCardProps) {
  return (
    <div
      aria-label={label}
      className={cn(
        "border-bh-border bg-bh-surface-elevated shadow-bh-card hover:border-bh-border-strong hover:shadow-bh-card-hover rounded-2xl border px-[1.05rem] py-[0.85rem] backdrop-blur-lg backdrop-saturate-160 [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] motion-reduce:transition-none",
        { "[--color-bh-metric-accent:var(--color-bh-ratio-accent)]": isRatio },
      )}
      role="group"
      style={accentColor ? ({ "--color-bh-metric-accent": accentColor } as CSSProperties) : undefined}
    >
      <div className="text-bh-metric-accent text-bh-caption mb-[0.4rem] font-semibold tracking-[0.09em] uppercase">
        {label}
      </div>
      <div className="text-bh-metric-accent text-bh-title leading-[1.3] font-semibold tracking-[-0.028em] wrap-break-word tabular-nums">
        {value}
      </div>
      {meta.map((item, metaIndex) => (
        <div
          className={cn(
            "text-bh-label text-bh-caption leading-[1.42] font-normal tracking-[-0.014em]",
            metaIndex === 0 ? "mt-[0.38rem]" : "mt-[0.22rem]",
          )}
          key={metaIndex}
        >
          {renderMetaItem(item)}
        </div>
      ))}
    </div>
  );
}
