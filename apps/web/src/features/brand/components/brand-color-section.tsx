import { SectionHeader } from "#/components/shared/section-header";
import { BrandSwatch } from "#/features/brand/components/brand-swatch";
import { BRAND_COLORS, NEUTRAL_COLORS } from "#/features/brand/data";

/** The palette: one hue for the brand, neutrals for everything else. */
export function BrandColorSection() {
  return (
    <section aria-labelledby="brand-colour-title" className="border-t border-ui-border/60 py-16">
      <SectionHeader
        eyebrow="03 · Colour"
        titleId="brand-colour-title"
        title="One hue, no second accent."
        description="Every value is a Tailwind 4 token the site already renders; the hex is that oklch resolved to sRGB. Sky carries the brand and the neutrals carry everything else."
        className="mb-10"
      />
      <div className="mb-8 grid gap-6 sm:grid-cols-3">
        {BRAND_COLORS.map((color) => (
          <BrandSwatch key={color.token} color={color} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {NEUTRAL_COLORS.map((color) => (
          <BrandSwatch key={color.token} color={color} />
        ))}
      </div>
    </section>
  );
}
