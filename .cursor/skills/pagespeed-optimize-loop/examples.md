# Examples

Run shell snippets from the **repository root** unless noted otherwise.

## Report layout

| Path                                  | Contents                  |
| ------------------------------------- | ------------------------- |
| `.cursor/pagespeed-reports/`          | Root for all JSON reports |
| `.cursor/pagespeed-reports/round-01/` | First optimization round  |
| `.cursor/pagespeed-reports/round-02/` | Second round, and so on   |

Each round folder should contain:

- `lighthouse-mobile.json`
- `lighthouse-desktop.json`

## Session start: clear old reports

Do this **once** at the beginning of a skill run so old audits are not mixed with new ones.

```bash
./.cursor/skills/pagespeed-optimize-loop/scripts/clear-pagespeed-reports.sh
```

Equivalent:

```bash
rm -rf .cursor/pagespeed-reports
mkdir -p .cursor/pagespeed-reports
```

Optional custom root (defaults to `.cursor/pagespeed-reports`):

```bash
./.cursor/skills/pagespeed-optimize-loop/scripts/clear-pagespeed-reports.sh path/to/custom-reports-root
```

## Session end: remove reports

Do this **when the Pagespeed/Lighthouse work is done** (after you have noted scores in chat or elsewhere) so JSON artifacts are not left in the repo:

```bash
./.cursor/skills/pagespeed-optimize-loop/scripts/remove-pagespeed-reports.sh
```

Equivalent (no empty folder remains):

```bash
rm -rf .cursor/pagespeed-reports
```

Custom root (must match what you used for audits):

```bash
./.cursor/skills/pagespeed-optimize-loop/scripts/remove-pagespeed-reports.sh path/to/custom-reports-root
```

## Wait for server before running Lighthouse

Always confirm the server is ready before auditing. A Lighthouse run against a server that hasn't started yet will produce misleading low scores.

```bash
BASE_URL="http://127.0.0.1:4173/"

# Option A — curl retry loop (no extra deps)
until curl -sf "$BASE_URL" > /dev/null; do sleep 1; done && echo "Server ready"

# Option B — wait-on (requires Node)
npx wait-on "$BASE_URL"
```

## After each code change: run Lighthouse for a round

Increment the **round number** (`1`, `2`, `3`, …) for each **build → audit** cycle.

### Performance only (intermediate rounds — faster)

```bash
./.cursor/skills/pagespeed-optimize-loop/scripts/run-lighthouse.sh \
  http://127.0.0.1:4173/ .cursor/pagespeed-reports 1 performance
```

### Full audit (final validation before stopping)

```bash
./.cursor/skills/pagespeed-optimize-loop/scripts/run-lighthouse.sh \
  http://127.0.0.1:4173/ .cursor/pagespeed-reports 1 \
  performance,accessibility,best-practices,seo
```

Outputs (example for round 1):

- `.cursor/pagespeed-reports/round-01/lighthouse-desktop.json`
- `.cursor/pagespeed-reports/round-01/lighthouse-mobile.json`

## Read scores from JSON (quick check)

### Performance score

```bash
node -e "
  const fs = require('fs');
  const p = process.argv[2];
  const j = JSON.parse(fs.readFileSync(p));
  console.log(Math.round(j.categories.performance.score * 100));
" .cursor/pagespeed-reports/round-01/lighthouse-mobile.json
```

### All four category scores at once

```bash
node -e "
  const fs = require('fs');
  const p = process.argv[2];
  const j = JSON.parse(fs.readFileSync(p));
  const cats = ['performance','accessibility','best-practices','seo'];
  cats.forEach(c => {
    const cat = j.categories[c];
    if (cat) console.log(c + ':', Math.round(cat.score * 100));
  });
" .cursor/pagespeed-reports/round-01/lighthouse-mobile.json
```

## Lighthouse CLI (manual commands)

Adjust host, port, and `round-01` to match the current round.

```bash
mkdir -p .cursor/pagespeed-reports/round-01

# Desktop — performance only
npx --yes lighthouse http://127.0.0.1:4173/ \
  --preset=desktop \
  --only-categories=performance \
  --output=json \
  --output-path=.cursor/pagespeed-reports/round-01/lighthouse-desktop.json \
  --chrome-flags="--headless --no-sandbox"

# Mobile — performance only
npx --yes lighthouse http://127.0.0.1:4173/ \
  --form-factor=mobile \
  --only-categories=performance \
  --output=json \
  --output-path=.cursor/pagespeed-reports/round-01/lighthouse-mobile.json \
  --chrome-flags="--headless --no-sandbox"
```

For full validation (all default categories), replace `--only-categories=performance` with:

```
--only-categories=performance,accessibility,best-practices,seo
```

**Scores**: each `categories.<n>.score` is **0–1**; multiply by **100** for display. Defaults: **Performance ≥ 90** on **both** mobile and desktop; **accessibility**, **best-practices**, and **seo** each **100** on **both** when those categories are part of the run.

## PageSpeed Insights API (public URL)

Requires an API key. Example (mobile):

```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com/&strategy=mobile&category=performance&key=YOUR_KEY"
```

Parse `lighthouseResult.categories` in the response. **Localhost** is not supported by PSI without a tunnel; prefer **Lighthouse CLI** locally. PSI has daily quota limits — avoid tight loops against the API; use Lighthouse CLI for local iteration.

## This monorepo (`@apps/docs`)

After **`vite build`**, production is served by Nitro from **`.output/`**. Use the same **`pnpm start`** entry as deployment:

```bash
pnpm --filter @apps/docs build

# Wait for build then start
PORT=4173 HOST=127.0.0.1 pnpm --filter @apps/docs start &
SERVER_PID=$!

# Wait for server ready
until curl -sf http://127.0.0.1:4173/ > /dev/null; do sleep 1; done

# Run audit (round 1, performance only)
./.cursor/skills/pagespeed-optimize-loop/scripts/run-lighthouse.sh \
  http://127.0.0.1:4173/ .cursor/pagespeed-reports 1 performance

# Stop server when done
kill $SERVER_PID
```

**Port 4173** is the convention for local Lighthouse in this repo. `pnpm start` runs `node .output/server/index.mjs`.
