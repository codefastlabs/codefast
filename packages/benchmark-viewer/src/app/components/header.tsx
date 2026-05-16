interface PageHeaderProps {
  title: string;
  onCopyLink: () => void;
}

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
            className="bh-btn-reload min-h-11 justify-center sm:min-h-0"
            onClick={onCopyLink}
            title="Copies URL including filters, scenario, and display toggles"
            type="button"
          >
            Copy link
          </button>
        </div>
      </div>
      <details
        className="bh-glass bh-glass--tight mt-5 px-4 py-3 sm:px-5 sm:py-3.5"
        id="intro-howto-details"
      >
        <summary className="bh-details-summary bh-details-summary--prominent">
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
