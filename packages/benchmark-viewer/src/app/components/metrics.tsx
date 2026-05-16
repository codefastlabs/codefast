import { tv } from "@codefast/tailwind-variants";
import type { MetricCardProps, MetricsResult } from "#/app/lib/metrics";
import type { EmbeddedScenarioSeries } from "#/types";

interface MetricsPanelProps {
  currentScenario: EmbeddedScenarioSeries | null;
  runIndices: Array<number>;
  metricsData: MetricsResult | null;
}

const chip = tv({
  base: "inline-flex items-center rounded-full px-[0.65rem] py-[0.15rem] text-[0.7rem] font-medium",
  variants: {
    variant: {
      warn: "text-bh-warn-fg border-bh-warn-border bg-bh-warn-bg border",
      ok: "text-bh-ok-fg border-bh-ok-border bg-bh-ok-bg border",
    },
  },
});

/**
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
        <h2 className="text-bh-label text-[0.65rem] font-semibold tracking-[0.14em] uppercase">
          Selected scenario metrics
        </h2>
        {currentScenario && runIndices.length > 0 && (
          <span className={chip({ variant: metricsData?.hasHighDispersion ? "warn" : "ok" })}>
            [{currentScenario.group}] {currentScenario.id}
          </span>
        )}
      </div>
      {currentScenario?.what && (
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{currentScenario.what}</p>
      )}
      <div className="mt-5 grid grid-cols-[1fr] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]">
        {metricsData?.cards.map((card, i) => (
          <MetricCard key={i} {...card} />
        ))}
      </div>
      {metricsData?.footnote && (
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">{metricsData.footnote}</p>
      )}
    </section>
  );
}

function MetricCard({ label, value, meta, accentColor, isRatio }: MetricCardProps) {
  return (
    <div
      aria-label={label}
      className={`border-bh-border bg-bh-surface-elevated shadow-bh-card hover:border-bh-border-strong hover:shadow-bh-card-hover rounded-2xl border px-[1.05rem] py-[0.85rem] backdrop-blur-lg backdrop-saturate-160 [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] motion-reduce:transition-none${isRatio ? " [--color-bh-metric-accent:var(--color-bh-ratio-accent)]" : ""}`}
      role="group"
      style={
        accentColor
          ? ({ "--color-bh-metric-accent": accentColor } as React.CSSProperties)
          : undefined
      }
    >
      <div className="text-bh-metric-accent mb-[0.4rem] text-[0.625rem] font-semibold tracking-[0.09em] uppercase">
        {label}
      </div>
      <div className="text-bh-metric-accent text-[1.05rem] leading-[1.3] font-semibold tracking-[-0.028em] wrap-break-word tabular-nums">
        {value}
      </div>
      {meta.map((m, i) => (
        <div
          className={`text-bh-label text-[0.72rem] leading-[1.42] font-normal tracking-[-0.014em]${i === 0 ? " mt-[0.38rem]" : " mt-[0.22rem]"}`}
          dangerouslySetInnerHTML={{ __html: m }}
          key={i}
        />
      ))}
    </div>
  );
}
