import type { MetricCardProps, MetricsResult } from "#/client/lib/metrics";
import type { EmbeddedScenarioSeries } from "#/server-types";

interface MetricsPanelProps {
  currentScenario: EmbeddedScenarioSeries | null;
  runIndices: Array<number>;
  metricsData: MetricsResult | null;
}

/**
 * @since 0.3.16-canary.1
 */
export function MetricsPanel({ currentScenario, runIndices, metricsData }: MetricsPanelProps) {
  return (
    <section
      aria-live="polite"
      className="bh-metrics-section bh-metrics-section--after-chart bh-glass bh-glass--tight"
      id="summary"
    >
      <div className="bh-metrics-section__head">
        <h2 className="bh-section-title">Selected scenario metrics</h2>
        {currentScenario && runIndices.length > 0 && (
          <span
            className={`bh-chip ${metricsData?.hasHighDispersion ? "bh-chip--warn" : "bh-chip--ok"}`}
          >
            [{currentScenario.group}] {currentScenario.id}
          </span>
        )}
      </div>
      {currentScenario?.what && <p className="bh-metrics-section__what">{currentScenario.what}</p>}
      <div className="bh-metrics-section__cards bh-metrics-grid">
        {metricsData?.cards.map((card, i) => (
          <MetricCard key={i} {...card} />
        ))}
      </div>
      {metricsData?.footnote && (
        <p className="bh-metrics-section__footnote">{metricsData.footnote}</p>
      )}
    </section>
  );
}

function MetricCard({ label, value, meta, accentColor, isRatio }: MetricCardProps) {
  return (
    <div
      aria-label={label}
      className={`bh-card${isRatio ? " bh-metric--accent-ratio" : ""}`}
      role="group"
      style={
        accentColor
          ? ({ "--color-bh-metric-accent": accentColor } as React.CSSProperties)
          : undefined
      }
    >
      <div className="bh-lbl bh-tint-lbl">{label}</div>
      <div className="bh-val bh-tint-val">{value}</div>
      {meta.map((m, i) => (
        <div className="bh-metric__meta" dangerouslySetInnerHTML={{ __html: m }} key={i} />
      ))}
    </div>
  );
}
