import { CopySnippet } from "#/components/shared/copy-snippet";
import { SectionHeader } from "#/components/shared/section-header";
import { INSTALL_STEPS } from "#/data/about";

export function InstallationSection() {
  return (
    <section aria-labelledby="about-installation-title" className="mb-20">
      <SectionHeader
        eyebrow="Installation"
        titleId="about-installation-title"
        title="Three steps to your first component"
        description="Each step is copy-ready. Paste into your terminal or project and you are ready to build."
        className="mb-10"
      />

      <ol className="flex flex-col gap-12">
        {INSTALL_STEPS.map(({ step, title, description, code, analyticsKind }) => (
          <li key={step} className="grid gap-5 sm:grid-cols-[56px_minmax(0,1fr)] sm:gap-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-ui-border/60 bg-ui-surface font-mono text-xs font-bold text-ui-muted">
              {step}
            </div>
            <article>
              <h3 className="mb-2 text-base font-semibold text-ui-fg">{title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-ui-muted">{description}</p>
              <CopySnippet
                code={code}
                label={`Copy ${title.toLowerCase()}`}
                analyticsKind={analyticsKind}
                analyticsName={`getting-started-step-${step}`}
              />
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
