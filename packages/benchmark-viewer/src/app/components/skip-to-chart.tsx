import { CHART_SKIP_TARGET_ID, handleSkipToChartClick } from "#/app/lib/skip-chart";

/**
 * Bypass link to the chart plot. Render only when the chart target is in the document.
 *
 * @since 0.3.16-canary.3
 */
export function SkipToChartLink() {
  return (
    <a
      className="outline-bh-blue bg-bh-surface-sticky shadow-bh-sticky fixed top-[max(0.75rem,env(safe-area-inset-top,0px))] left-[max(0.75rem,env(safe-area-inset-left,0px))] z-500 translate-y-[-120%] rounded-xl border border-white/12 px-3.5 py-2 text-sm font-medium text-zinc-100 backdrop-blur-xl focus:translate-y-0 focus:outline focus:outline-offset-2"
      href={`#${CHART_SKIP_TARGET_ID}`}
      onClick={handleSkipToChartClick}
    >
      Skip to chart
    </a>
  );
}
