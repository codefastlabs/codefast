import { DisclosurePanel } from "#app/components/disclosure-panel";
import { Kbd } from "#app/components/kbd";

interface PageHeaderProps {
  title: string;
  onCopyLink: () => void;
}

/**
 * Renders the page title, copy-link button, and the collapsible how-to-read primer.
 *
 * @since 0.3.16-canary.3
 */
export function PageHeader({ title, onCopyLink }: PageHeaderProps) {
  return (
    <header className="mb-8 border-b border-white/6 pb-6 sm:mb-10 sm:pb-8">
      <p className="text-bh-caption font-semibold tracking-[0.22em] text-cyan-300/90 uppercase">Bench history viewer</p>
      <h1 className="text-bh-display mt-3 font-semibold tracking-[-0.02em] wrap-break-word text-zinc-50">{title}</h1>
      <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-bh-body max-w-prose leading-relaxed text-pretty wrap-break-word text-zinc-400/95">
          Median hz/op per saved run, optional P25–P75 bands, and primary-vs-compare ratios.{" "}
          <span className="text-bh-label-muted">Press</span> <Kbd>⌘K</Kbd>{" "}
          <span className="text-bh-label-muted">or</span> <Kbd>Ctrl+K</Kbd>{" "}
          <span className="text-bh-label-muted">for quick actions.</span>
        </p>
        <div className="flex w-full shrink-0 flex-wrap items-stretch gap-2 sm:w-auto sm:items-center sm:justify-end">
          <button
            aria-label="Copy link to this view"
            className="border-bh-border bh-hover-ready:border-bh-border-strong bg-bh-fill-white-4 bh-hover-ready:bg-bh-fill-white-7 shadow-bh-btn-reload text-bh-ink bh-hover-ready:text-bh-ink-hover bh-aria-busy:opacity-55 bh-aria-busy:cursor-wait focus-visible:outline-bh-blue text-bh-small inline-flex min-h-11 items-center justify-center gap-[0.4rem] rounded-full border px-[0.95rem] py-[0.38rem] font-[inherit] leading-tight font-medium tracking-[-0.015em] backdrop-blur-md backdrop-saturate-160 [transition:background_0.18s_ease,border-color_0.18s_ease,color_0.18s_ease] focus-visible:outline focus-visible:outline-offset-[0.1875rem] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none sm:min-h-0"
            onClick={onCopyLink}
            title="Copies URL including filters, scenario, and display toggles"
            type="button"
          >
            Copy link
          </button>
        </div>
      </div>
      <DisclosurePanel className="mt-5" id="intro-howto-details" summary="How to read this viewer">
        <div className="text-bh-small leading-relaxed text-zinc-400">
          <p>
            Quantiles mirror{" "}
            <code className="rounded-md bg-white/8 px-1.5 py-0.5 font-mono text-[0.88em] text-cyan-200/90">
              report.ts
            </code>{" "}
            across trials. Bands are per‑trial hz/op spread (P25–P75); tooltip IQR% and a dispersion hint highlight
            noisy runs. Axis labels use your <strong className="font-medium text-zinc-300">local time</strong>. Toggle{" "}
            <strong className="font-medium text-zinc-300">Primary ratios</strong> to plot primary ÷ compare in its own
            chart under the throughput one, with parity marked. Use{" "}
            <strong className="font-medium text-zinc-300">Runs shown</strong> to focus on the most recent history
            window.
          </p>
        </div>
      </DisclosurePanel>
    </header>
  );
}
