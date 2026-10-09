# @internal/design-system

Builds the files of the **Codefast UI** design system — a Design System artifact on claude.ai — from `@codefast/ui`, the
codefastlabs.com component registry and the brand assets. Private; never published.

```bash
pnpm design-system
```

The task runs through Turborepo and is cached: it rebuilds only when `@codefast/ui` (or a package it depends on), the
registry under `apps/web/src/registry`, the brand files under `apps/web/public/brand`, `apps/web/src/styles.css`, the
lockfile or this package changes. Otherwise it replays the last output.

## What it writes

Everything lands in `dist/`, laid out the way the artifact serves it:

| Path                        | What                                                                                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project/tokens.json`       | Colors (light and dark) from the palette in `src/config.ts`, the type scale, spacing, radius, shadows.                                                                                 |
| `project/README.md`         | The brand book: `content/brand-book.md` with its contrast and motion sections filled from the source.                                                                                  |
| `project/Palettes.md`       | Every palette `@codefast/ui` ships.                                                                                                                                                    |
| `project/components/`       | `bundle.js` (every export as `window.CodefastUI`), `bundle.css`, `lib/` runtimes, `index.d.ts`, and per component a `preview.html` compiled from its registry demo plus a `README.md`. |
| `project/assets/`, `fonts/` | Brand marks, the Lucide icons the components render, the Inter variable font.                                                                                                          |
| `files.json`                | Every file's SHA-256, size and kind: `upload` (an image for the asset store) or `file`.                                                                                                |
| `index-fields.json`         | The keys of the artifact's `design-system.json` this build owns: `title`, `namespace`, `libraries`, `groups`, and each asset group's `name`, `tile` and `order`.                       |

Before writing anything the build mounts every preview in jsdom on the real runtime scripts and fails if one throws, so
a demo that needs a missing provider, or a part the bundle lacks, is caught here rather than on the page.

## What is hand-written

- `content/` — the brand book, the cover, and the Logos and Icons guidance.
- `src/config.ts` — the palette, where each token is used, the text styles by role, the spacing steps worth naming, and
  how cards are grouped, named and sized.

Everything else is read from the source on each run. A new color token or component file without its note or demo fails
the build with a message naming what to add.

## Publishing

Publishing needs the claude.ai Artifact tool, so it is a Claude Code session's job, not CI's:

1. Run `pnpm design-system`.
2. Read the artifact's `project/design-system.json`, and compare `dist/files.json` with the files it serves.
3. Upload each changed `upload` file to the artifact's asset store and write its record (`name`, `blob`, `size`, `type`)
   under `assetGroups.<Group>.files`.
4. Publish the changed `file` entries in one call, with `dist` as the root (`index.d.ts` as `text/plain`).
5. Last, publish `design-system.json` with `index-fields.json` merged in and a new `lastChange`. A brand-new artifact
   needs nothing else: its index is these keys, the upload records, and the type's `createdOnFiles` marker.
