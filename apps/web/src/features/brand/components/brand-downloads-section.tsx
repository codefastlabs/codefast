import { DownloadIcon } from "lucide-react";

import { SectionHeader } from "#/components/shared/section-header";
import { BRAND_DOWNLOADS } from "#/features/brand/data";

/** Every asset as a direct download from `public/`. */
export function BrandDownloadsSection() {
  return (
    <section aria-labelledby="brand-downloads-title" className="border-t border-ui-border/60 py-16">
      <SectionHeader
        eyebrow="06 · Downloads"
        titleId="brand-downloads-title"
        title="Take the files."
        description="Marks as SVG, lockups and icons as PNG at retina size. The rasters are rendered from the same sources by a script in the repository, so what you download is what the site ships."
        className="mb-10"
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BRAND_DOWNLOADS.map((asset) => (
          <li key={asset.href}>
            <a
              href={asset.href}
              download
              className="group flex h-full flex-col gap-2 rounded-2xl border border-ui-border/60 bg-ui-card p-5 no-underline transition-colors hover:border-ui-brand/60"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ui-fg">{asset.label}</span>
                <span className="font-mono text-xs text-ui-muted">{asset.format}</span>
              </span>
              <span className="flex-1 text-sm leading-relaxed text-ui-muted">{asset.note}</span>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-ui-brand">
                Download
                <DownloadIcon className="size-3.5 transition-transform group-hover:translate-y-0.5" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
