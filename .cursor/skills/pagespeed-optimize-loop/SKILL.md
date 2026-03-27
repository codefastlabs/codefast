---
name: pagespeed-optimize-loop
description: Production build, serve, Lighthouse or PageSpeed audits, fix issues iteratively. Performance default ≥90 mobile/desktop; accessibility, best practices, and SEO default 100/100 on both. Clears .cursor/pagespeed-reports at session start; removes reports after session end; writes JSON per round under round-NN. Use for Core Web Vitals, Lighthouse/PageSpeed tuning, or iterative speed and quality work (any language).
---

# PageSpeed / Lighthouse optimization loop

## Goal

Automate **build → serve → measure → fix → re-measure** until targets are met on **mobile and desktop** (unless stopped by a max-iteration cap). **Performance** uses a **realistic** threshold (default **≥ 90**); **accessibility**, **best practices**, and **SEO** are expected at **100/100** each — fix every weighted failing audit until those categories pass.

## How to audit

| Context        | Tool                                                      |
| -------------- | --------------------------------------------------------- |
| **Localhost**  | **Lighthouse CLI** (same engine as PageSpeed lab data)    |
| **Public URL** | **PageSpeed Insights API** or Lighthouse against that URL |

Details: [reference.md](reference.md).

## Reports (required workflow)

| Step                            | Action                                                                                                                                                                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root directory**              | From repo root: **`.cursor/pagespeed-reports/`**                                                                                                                                                                                               |
| **Start of each skill session** | **Clear** old reports so runs do not mix — run [scripts/clear-pagespeed-reports.sh](scripts/clear-pagespeed-reports.sh), or `rm -rf .cursor/pagespeed-reports && mkdir -p .cursor/pagespeed-reports`                                           |
| **End of each skill session**   | **Remove** reports so large JSON is not left in the tree — run [scripts/remove-pagespeed-reports.sh](scripts/remove-pagespeed-reports.sh), or `rm -rf .cursor/pagespeed-reports` (after you have summarized scores for the user).              |
| **Each round**                  | Write **`lighthouse-mobile.json`** and **`lighthouse-desktop.json`** under **`.cursor/pagespeed-reports/round-01/`**, **`round-02/`**, … Use [scripts/run-lighthouse.sh](scripts/run-lighthouse.sh) or equivalent — [examples.md](examples.md) |

## Score threshold

- **Performance** (default): **≥ 90** on **mobile** and **desktop** (`categories.performance.score` × 100). **Relaxed** only if the user asks: **≥ 85**. **Stretch** only if the user asks: **≥ 95** or **100**.
- **Accessibility**, **best practices**, **SEO**: **100/100** on **mobile** and **desktop** (`categories.<id>.score` × 100). Treat any score below 100 as incomplete for that category.
- Lab scores vary run-to-run (**± a few points**). **Performance**: if you are **1 point** below its threshold, **re-run once** before large refactors. **Other categories**: if you land at **99**, **re-run once** before invasive changes (same idea as the old “100-only” loop).

## One-time setup

Pick target path (e.g. `/`), **Performance threshold** (default **≥ 90** mobile + desktop unless the user specifies otherwise), confirm **a11y / best-practices / SEO = 100** unless the user overrides, **iteration cap** (e.g. **8–15**), and document **build** + production **`start`** for the app — see [examples.md](examples.md) for this monorepo.

## Each round

1. Production **build**
2. **Serve** on a fixed host/port; wait until the URL returns **HTTP 200**
3. Run **mobile** and **desktop** Lighthouse — use **`--only-categories=performance`** while tuning speed; use **`performance,accessibility,best-practices,seo`** (or separate runs per category) when validating the **full** default bar before stopping
4. **Save** JSON under the correct **`round-NN`**
5. Record scores and failing audits; apply fixes using the mapping below
6. **Rebuild** and repeat

## When to stop

- **Success**: on **both** mobile and desktop, **Performance** meets the **session threshold** (default **≥ 90**) **and** **accessibility**, **best practices**, and **SEO** are **100** (when those categories are in scope for the run).
- **Cap reached**: report best scores, remaining audits, and last `round-NN` paths; suggest whether lowering only the **Performance** threshold or scoping URLs is appropriate — **do not** lower the **100** bar for a11y / best-practices / SEO unless the user explicitly allows it.

## After the session (cleanup)

**Required** once the loop is finished (success, cap, or user stops): delete **`.cursor/pagespeed-reports`** so Lighthouse JSON does not linger in the workspace. Use [scripts/remove-pagespeed-reports.sh](scripts/remove-pagespeed-reports.sh) or `rm -rf .cursor/pagespeed-reports`. Do this **after** copying any scores or audit notes into your reply to the user.

## Audit → fix mapping

Prioritize **LCP, CLS, INP** and main-thread cost before minor polish.

| Theme           | Direction                                                         |
| --------------- | ----------------------------------------------------------------- |
| Render-blocking | Defer/async scripts, critical CSS, trim blocking CSS              |
| Unused JS/CSS   | Code-splitting, tree-shaking, remove dead imports                 |
| Images / LCP    | Dimensions, `fetchpriority`, modern formats, `srcset`, CDN        |
| Fonts           | `font-display: swap`, subset, preload only critical weights       |
| CLS             | Reserve space for media/embeds; avoid late inserts above the fold |
| Third parties   | Lazy load, facades, consent-gated loading                         |
| TTFB / server   | Cache, edge, SSR/streaming (framework-specific)                   |
| Document        | HTTP/2+, compression, fewer redirects                             |

Re-audit after changes; do not assume gains without a new JSON report.

## Project notes (this repo)

**pnpm** + **turbo**. Docs app **`@apps/docs`**: `vite build`, then Nitro **`pnpm start`** (`node .output/server/index.mjs`). For audits use **`PORT=4173`** and base URL **`http://127.0.0.1:4173/`**. Commands: [examples.md](examples.md).

## Additional resources

| Resource                                                                 | Purpose                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------ |
| [reference.md](reference.md)                                             | PSI API, JSON paths, quotas, localhost vs public URL   |
| [examples.md](examples.md)                                               | Commands, monorepo flow, report layout                 |
| [scripts/clear-pagespeed-reports.sh](scripts/clear-pagespeed-reports.sh) | Reset `.cursor/pagespeed-reports` before a new session |
| [scripts/remove-pagespeed-reports.sh](scripts/remove-pagespeed-reports.sh) | Delete `.cursor/pagespeed-reports` after the session |
| [scripts/run-lighthouse.sh](scripts/run-lighthouse.sh)                   | Mobile + desktop JSON under `round-NN`                 |
