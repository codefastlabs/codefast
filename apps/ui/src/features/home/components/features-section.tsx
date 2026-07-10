import { SectionHeader } from "#/components/shared/section-header";
import { FEATURES } from "#/features/home/data";

export function FeaturesSection() {
  return (
    <section aria-labelledby="home-features-title" className="py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Why codefast/ui"
          titleId="home-features-title"
          title={
            <>
              Built for the way
              <br />
              you actually work.
            </>
          }
          className="mb-16"
        />

        <div className="divide-y divide-ui-border/60">
          {FEATURES.map(({ number, title, description }) => (
            <article key={title} className="grid gap-4 py-10 sm:grid-cols-[56px_1fr_1.5fr] sm:gap-10">
              <p className="font-mono text-sm text-ui-muted tabular-nums">{number}</p>
              <h3 className="text-base font-semibold text-ui-fg">{title}</h3>
              <p className="text-sm leading-relaxed text-ui-muted">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
