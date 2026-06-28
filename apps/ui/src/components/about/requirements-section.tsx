import { Badge } from "@codefast/ui/badge";

import { SectionHeader } from "#/components/shared/section-header";
import { REQUIREMENTS } from "#/data/about";

export function RequirementsSection() {
  return (
    <section aria-labelledby="about-requirements-title" className="mb-16">
      <SectionHeader
        eyebrow="Requirements"
        titleId="about-requirements-title"
        title="Before you begin"
        description="@codefast/ui assumes a modern React + Tailwind stack. No extra config files — just install, import the CSS, and compose."
        className="mb-8"
      />

      <div className="grid grid-cols-2 gap-6 rounded-2xl border border-ui-border/60 bg-ui-card p-6 sm:grid-cols-4 sm:gap-8">
        {REQUIREMENTS.map(({ label, value }) => (
          <div key={label}>
            <p className="mb-1 text-xs font-semibold tracking-widest text-ui-muted uppercase">{label}</p>
            <p className="text-sm font-semibold text-ui-fg">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline" className="border-ui-border/60 font-normal text-ui-muted">
          Radix UI primitives
        </Badge>
        <Badge variant="outline" className="border-ui-border/60 font-normal text-ui-muted">
          Strict TypeScript
        </Badge>
        <Badge variant="outline" className="border-ui-border/60 font-normal text-ui-muted">
          Dark mode ready
        </Badge>
      </div>
    </section>
  );
}
