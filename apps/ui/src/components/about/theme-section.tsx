import { Badge } from "@codefast/ui/badge";

import { CopySnippet } from "#/components/shared/copy-snippet";
import { SectionHeader } from "#/components/shared/section-header";
import { FEATURED_THEMES, THEME_SNIPPET } from "#/data/about";

export function ThemeSection() {
  return (
    <section aria-labelledby="about-theme-title" className="mb-20">
      <SectionHeader
        eyebrow="Theming"
        titleId="about-theme-title"
        title="Pick a palette, dark mode follows"
        description="Swap the theme import to change accent and neutral tokens. Components read semantic CSS variables — no prop drilling for light and dark."
        className="mb-8"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FEATURED_THEMES.map((theme) => (
          <Badge key={theme} variant="secondary" className="font-mono text-xs font-normal capitalize">
            {theme}
          </Badge>
        ))}
        <Badge variant="outline" className="border-ui-border/60 font-normal text-ui-muted">
          +14 more
        </Badge>
      </div>

      <CopySnippet
        code={THEME_SNIPPET("sky")}
        label="Copy theme CSS setup"
        analyticsKind="setup-snippet"
        analyticsName="theme-sky"
      />

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ui-muted">
        For SSR apps, add{" "}
        <code className="rounded border border-ui-border/60 bg-ui-surface px-1.5 py-0.5 font-mono text-xs text-ui-fg">
          @codefast/theme
        </code>{" "}
        to persist color-scheme preference without a flash of the wrong theme. This docs site uses sky; consumer apps
        typically start with neutral.
      </p>
    </section>
  );
}
