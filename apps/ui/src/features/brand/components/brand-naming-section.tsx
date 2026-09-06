import { SectionHeader } from "#/components/shared/section-header";

/** How the name is written: the organisation, the monorepo, the packages. */
export function BrandNamingSection() {
  return (
    <section aria-labelledby="brand-naming-title" className="border-t border-ui-border/60 py-16">
      <SectionHeader
        eyebrow="05 · Name"
        titleId="brand-naming-title"
        title="Say it the same way everywhere."
        className="mb-10"
      />
      <dl className="grid gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-2xl border border-ui-border/60 bg-ui-card p-5">
          <dt className="text-lg font-semibold tracking-tight text-ui-fg">Codefast Labs</dt>
          <dd className="text-sm leading-relaxed text-ui-muted">
            The organisation. Two words, one capital: in copyright lines, page titles, and wherever a company is named.
          </dd>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-ui-border/60 bg-ui-card p-5">
          <dt className="text-lg font-semibold tracking-tight text-ui-fg">Codefast</dt>
          <dd className="text-sm leading-relaxed text-ui-muted">
            The monorepo and the package family, as in the Codefast monorepo. Never CodeFast.
          </dd>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-ui-border/60 bg-ui-card p-5">
          <dt className="font-mono text-lg font-medium text-ui-fg">@codefast/di</dt>
          <dd className="text-sm leading-relaxed text-ui-muted">
            A package. Mono, lowercase, with its scope. Never Codefast DI. The lowercase handle codefastlabs belongs
            only where spaces are impossible: the GitHub organisation, the domain, and the wordmark.
          </dd>
        </div>
      </dl>
    </section>
  );
}
