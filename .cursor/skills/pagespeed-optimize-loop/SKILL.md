---
name: pagespeed-optimize-loop
description: Production build, serve, Lighthouse or PageSpeed audits, fix highest-impact issues, repeat until Performance is 100 on mobile and desktop (or iteration cap). Clears .cursor/pagespeed-reports at session start; writes JSON per round under round-NN. Use for Core Web Vitals, Lighthouse/PageSpeed tuning, performance CI gates, or when users ask for iterative speed work (any language).
---

# PageSpeed / Lighthouse optimization loop

## Goal

Automate **build → serve → measure → fix → re-measure** until **Performance score is 100** for **both mobile and desktop** (unless stopped by a max-iteration cap).

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
| **Each round**                  | Write **`lighthouse-mobile.json`** and **`lighthouse-desktop.json`** under **`.cursor/pagespeed-reports/round-01/`**, **`round-02/`**, … Use [scripts/run-lighthouse.sh](scripts/run-lighthouse.sh) or equivalent — [examples.md](examples.md) |

## Score threshold

- **Performance = 100/100** on **mobile** and **desktop** (`categories.performance.score` × 100).
- Lab scores can vary slightly between runs; if you land at 99, re-run once before large code changes.

## One-time setup

Pick target path (e.g. `/`), **iteration cap** (e.g. **8–15**), and document **build** + production **`start`** for the app — see [examples.md](examples.md) for this monorepo.

## Each round

1. Production **build**
2. **Serve** on a fixed host/port; wait until the URL returns **HTTP 200**
3. Run **mobile** and **desktop** Lighthouse (performance category)
4. **Save** JSON under the correct **`round-NN`**
5. Record scores and failing audits; apply fixes using the mapping below
6. **Rebuild** and repeat

## When to stop

- **Success**: mobile **and** desktop Performance are **100**
- **Cap reached**: report best scores, remaining audits, and last `round-NN` paths

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
| [scripts/run-lighthouse.sh](scripts/run-lighthouse.sh)                   | Mobile + desktop JSON under `round-NN`                 |
