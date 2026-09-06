import { SectionHeader } from "#/components/shared/section-header";
import { BrandMark } from "#/features/brand/components/brand-mark";

/** The mark on light, on dark and in mono, plus the rule for small sizes. */
export function BrandMarkSection() {
  return (
    <section aria-labelledby="brand-mark-title" className="border-t border-ui-border/60 py-16">
      <SectionHeader
        eyebrow="01 · Mark"
        titleId="brand-mark-title"
        title="One lit tile."
        description="Four tiles stand for a family of packages; the lit one is the package in your hands. Built on a 64-unit grid: 4 margin, 24 tile, 8 gap, 6 radius."
        className="mb-10"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <figure className="flex flex-col gap-3">
          <div className="flex h-56 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-900 [--ui-brand:var(--color-sky-600)]">
            <BrandMark tone="lit" className="size-28" />
          </div>
          <figcaption className="text-sm leading-relaxed text-ui-muted">
            On light: the lead tile in Sky 600, the trail in Neutral 900 at 0.4, 0.4 and 0.15.
          </figcaption>
        </figure>
        <figure className="flex flex-col gap-3">
          <div className="flex h-56 items-center justify-center rounded-2xl bg-neutral-950 text-neutral-50 [--ui-brand:var(--color-sky-400)]">
            <BrandMark tone="lit" className="size-28" />
          </div>
          <figcaption className="text-sm leading-relaxed text-ui-muted">
            On dark: the lead tile in Sky 400, the trail in Neutral 50, the pair the site uses in dark mode.
          </figcaption>
        </figure>
        <figure className="flex flex-col gap-3">
          <div className="flex h-56 items-center justify-center rounded-2xl border border-ui-border/60 bg-ui-card text-ui-fg">
            <BrandMark className="size-28" />
          </div>
          <figcaption className="text-sm leading-relaxed text-ui-muted">
            Mono, as the site header draws it: one colour, the fade alone carries the idea. Use it inline and wherever
            the brand colour is not available.
          </figcaption>
        </figure>
      </div>
      <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-ui-border/60 bg-ui-card p-5 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex items-end gap-5 text-ui-fg">
          <BrandMark tone="lit" small className="size-4" />
          <BrandMark tone="lit" small className="size-6" />
          <BrandMark tone="lit" small className="size-8" />
        </div>
        <p className="text-sm leading-relaxed text-ui-muted">
          At 32 px and under the trail brightens to 0.5, 0.5 and 0.25 so the fourth tile survives a browser tab. Nothing
          else changes: the same file at every size.
        </p>
      </div>
    </section>
  );
}
