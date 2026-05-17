interface PageHeaderProps {
  title: string;
  onCopyLink: () => void;
}

/**
 * @since 0.3.16-canary.3
 */
export function PageHeader({ title, onCopyLink }: PageHeaderProps) {
  return (
    <header className="mb-8 max-w-4xl border-b border-white/6 pb-6 sm:mb-10 sm:pb-8">
      <p className="text-[0.6875rem] font-semibold tracking-[0.22em] text-cyan-300/90 uppercase">
        Bench history viewer
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em] wrap-break-word text-zinc-50 sm:text-[1.75rem] sm:leading-tight">
        {title}
        <span className="font-normal text-zinc-400"> · hz/op median per run</span>
      </h1>
      <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-prose text-[0.9375rem] leading-relaxed text-pretty wrap-break-word text-zinc-400/95">
          Median hz/op per saved run, optional P25–P75 bands, and primary-vs-compare ratios.{" "}
          <span className="text-zinc-500">Press</span>{" "}
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-px font-mono text-zinc-300">
            ⌘K
          </kbd>{" "}
          <span className="text-zinc-500">or</span>{" "}
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-px font-mono text-zinc-300">
            Ctrl+K
          </kbd>{" "}
          <span className="text-zinc-500">for quick actions.</span>
        </p>
        <div className="flex w-full shrink-0 flex-wrap items-stretch gap-2 sm:w-auto sm:items-center sm:justify-end">
          <button
            aria-label="Copy link to this view"
            className="text-bh-ink border-bh-border bg-bh-fill-white-4 shadow-bh-btn-reload bh-hover-ready:text-bh-ink-hover bh-hover-ready:border-bh-border-strong bh-hover-ready:bg-bh-fill-white-7 focus-visible:outline-bh-blue bh-aria-busy:cursor-wait bh-aria-busy:opacity-55 inline-flex min-h-11 items-center justify-center gap-[0.4rem] rounded-full border px-[0.95rem] py-[0.38rem] font-[inherit] text-[0.8125rem] leading-tight font-medium tracking-[-0.015em] backdrop-blur-[0.875rem] backdrop-saturate-160 [transition:background_0.18s_ease,border-color_0.18s_ease,color_0.18s_ease] focus-visible:outline focus-visible:outline-offset-[0.1875rem] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none sm:min-h-0"
            onClick={onCopyLink}
            title="Copies URL including filters, scenario, and display toggles"
            type="button"
          >
            Copy link
          </button>
        </div>
      </div>
      <details
        className="border-bh-border bg-bh-surface mt-5 rounded-2xl border px-4 py-3 shadow-(--shadow-bh-glass-tight) backdrop-blur-xl backdrop-saturate-180 sm:px-5 sm:py-3.5"
        id="intro-howto-details"
      >
        <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-100 select-none marker:content-[''] hover:text-white [&::-webkit-details-marker]:hidden">
          How to read this viewer
        </summary>
        <div className="mt-3 border-t border-white/6 pt-3 text-sm leading-relaxed text-zinc-400">
          <p>
            Quantiles mirror{" "}
            <code className="rounded-md bg-white/8 px-1.5 py-0.5 font-mono text-[0.88em] text-cyan-200/90">
              report.ts
            </code>{" "}
            across trials. Bands are per‑trial hz/op spread (P25–P75); tooltip IQR% and a dispersion
            hint highlight noisy runs. Axis labels use your{" "}
            <strong className="font-medium text-zinc-300">local time</strong>. Toggle{" "}
            <strong className="font-medium text-zinc-300">Primary ratios</strong> to overlay primary
            ÷ compare on the right axis. Use{" "}
            <strong className="font-medium text-zinc-300">Runs shown</strong> to focus on the most
            recent history window.
          </p>
        </div>
      </details>
    </header>
  );
}
