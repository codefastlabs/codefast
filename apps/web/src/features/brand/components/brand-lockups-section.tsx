import { SectionHeader } from "#/components/shared/section-header";
import { BrandMark } from "#/features/brand/components/brand-mark";
import { BrandWordmark } from "#/features/brand/components/brand-wordmark";

/** The horizontal and stacked lockups on light and on dark. */
export function BrandLockupsSection() {
  return (
    <section aria-labelledby="brand-lockups-title" className="border-t border-ui-border/60 py-16">
      <SectionHeader
        eyebrow="02 · Lockups"
        titleId="brand-lockups-title"
        title="Mark, then word."
        description="Horizontal for headers and footers, stacked for avatars and covers. Clear space is one tile on every side; the mark goes no smaller than 16 px, the wordmark no smaller than 14 px."
        className="mb-10"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-12 rounded-2xl border border-neutral-200 bg-white px-8 py-12 text-neutral-900 [--ui-brand:var(--color-sky-600)]">
          <div className="flex items-center gap-3">
            <BrandMark tone="lit" className="size-10" />
            <BrandWordmark className="text-3xl" />
          </div>
          <div className="flex flex-col items-center gap-4">
            <BrandMark tone="lit" className="size-16" />
            <BrandWordmark className="text-2xl" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-12 rounded-2xl bg-neutral-950 px-8 py-12 text-neutral-50 [--ui-brand:var(--color-sky-400)]">
          <div className="flex items-center gap-3">
            <BrandMark tone="lit" className="size-10" />
            <BrandWordmark className="text-3xl" />
          </div>
          <div className="flex flex-col items-center gap-4">
            <BrandMark tone="lit" className="size-16" />
            <BrandWordmark className="text-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
