import { SectionHeader } from "#/components/shared/section-header";
import { BrandWordmark } from "#/features/brand/components/brand-wordmark";

/** The type system: one face, four roles. */
export function BrandTypeSection() {
  return (
    <section aria-labelledby="brand-type-title" className="border-t border-ui-border/60 py-16">
      <SectionHeader
        eyebrow="04 · Type"
        titleId="brand-type-title"
        title="Inter, four ways."
        description="Inter Variable on the site, Inter everywhere else, with ui-sans-serif and system-ui as the fallback stack."
        className="mb-10"
      />
      <dl className="flex flex-col divide-y divide-ui-border/60">
        <div className="grid gap-3 py-6 md:grid-cols-[minmax(0,1fr)_18rem] md:items-center md:gap-8">
          <dt>
            <BrandWordmark className="text-4xl text-ui-fg" />
          </dt>
          <dd className="text-sm leading-relaxed text-ui-muted">Wordmark: Inter 600, −0.02em, lowercase, one word.</dd>
        </div>
        <div className="grid gap-3 py-6 md:grid-cols-[minmax(0,1fr)_18rem] md:items-center md:gap-8">
          <dt className="text-4xl leading-none font-bold tracking-tighter text-ui-fg">
            Packages built <span className="text-ui-brand">for React 19.</span>
          </dt>
          <dd className="text-sm leading-relaxed text-ui-muted">
            Headlines: Inter 700, −0.03em. One Sky phrase carries the point.
          </dd>
        </div>
        <div className="grid gap-3 py-6 md:grid-cols-[minmax(0,1fr)_18rem] md:items-center md:gap-8">
          <dt className="text-lg leading-relaxed text-ui-muted">
            Typed, documented, and published under @codefast. Components, variant styling, theming, tracking, and
            dependency injection.
          </dt>
          <dd className="text-sm leading-relaxed text-ui-muted">
            Body: Inter 400, 1.6 line height, muted on the page background.
          </dd>
        </div>
        <div className="grid gap-3 py-6 md:grid-cols-[minmax(0,1fr)_18rem] md:items-center md:gap-8">
          <dt className="font-mono text-xl font-medium text-ui-fg">
            @codefast/<span className="text-ui-brand">di</span> · @codefast/<span className="text-ui-brand">ui</span>
          </dt>
          <dd className="text-sm leading-relaxed text-ui-muted">
            Package names stay in mono and lowercase, the package after the slash in Sky.
          </dd>
        </div>
      </dl>
    </section>
  );
}
