#!/usr/bin/env node
/**
 * RTL audit for packages/ui — read-only detector, not a codemod.
 *
 * Ports a physical-to-logical class mapping table into violation
 * detectors: scans string literals in src for physical-direction Tailwind
 * classes and reports the logical (or `rtl:`-paired) replacement. Exits
 * non-zero when violations remain so it can gate CI.
 *
 * Allowlist: scripts/audit-rtl-allowlist.txt — one entry per line, either a
 * bare class token or `relative/path.tsx:token`; `#` starts a comment.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(packageRoot, "src");
const allowlistPath = join(packageRoot, "scripts", "audit-rtl-allowlist.txt");

// Physical → logical replacements. Order matters: negative before positive,
// specific corners before general edges, with-value before bare.
const RTL_MAPPINGS = [
  ["-ml-", "-ms-"],
  ["-mr-", "-me-"],
  ["ml-", "ms-"],
  ["mr-", "me-"],
  ["pl-", "ps-"],
  ["pr-", "pe-"],
  ["-left-", "-start-"],
  ["-right-", "-end-"],
  ["left-", "start-"],
  ["right-", "end-"],
  ["inset-l-", "inset-inline-start-"],
  ["inset-r-", "inset-inline-end-"],
  ["rounded-tl-", "rounded-ss-"],
  ["rounded-tr-", "rounded-se-"],
  ["rounded-bl-", "rounded-es-"],
  ["rounded-br-", "rounded-ee-"],
  ["rounded-l-", "rounded-s-"],
  ["rounded-r-", "rounded-e-"],
  ["rounded-tl", "rounded-ss"],
  ["rounded-tr", "rounded-se"],
  ["rounded-bl", "rounded-es"],
  ["rounded-br", "rounded-ee"],
  ["rounded-l", "rounded-s"],
  ["rounded-r", "rounded-e"],
  ["border-l-", "border-s-"],
  ["border-r-", "border-e-"],
  ["border-l", "border-s"],
  ["border-r", "border-e"],
  ["text-left", "text-start"],
  ["text-right", "text-end"],
  ["scroll-ml-", "scroll-ms-"],
  ["scroll-mr-", "scroll-me-"],
  ["scroll-pl-", "scroll-ps-"],
  ["scroll-pr-", "scroll-pe-"],
  ["float-left", "float-start"],
  ["float-right", "float-end"],
  ["clear-left", "clear-start"],
  ["clear-right", "clear-end"],
  ["origin-top-left", "origin-top-start"],
  ["origin-top-right", "origin-top-end"],
  ["origin-bottom-left", "origin-bottom-start"],
  ["origin-bottom-right", "origin-bottom-end"],
  ["origin-left", "origin-start"],
  ["origin-right", "origin-end"],
];

// translate-x has no logical equivalent — it needs an rtl:-negated twin.
const RTL_TRANSLATE_X_MAPPINGS = [
  ["-translate-x-", "translate-x-"],
  ["translate-x-", "-translate-x-"],
];

// Classes that need an rtl:*-reverse companion.
const RTL_REVERSE_MAPPINGS = [
  ["space-x-", "space-x-reverse"],
  ["divide-x-", "divide-x-reverse"],
];

// Classes that need an rtl: companion with the swapped value.
const RTL_SWAP_MAPPINGS = [
  ["cursor-w-resize", "cursor-e-resize"],
  ["cursor-e-resize", "cursor-w-resize"],
];

// Anything anchored to a physical side variant stays physical: Radix resolves
// `side` per direction, and a border/position/slide tied to that side must
// follow it. (Deliberately stricter than upstream, which still maps borders.)
// Covers codefast's custom variants (data-side-left), Radix data attributes
// (data-[side=left]) and arbitrary selectors ([data-side=left]).
const PHYSICAL_SIDE_VARIANT = /data-side-(?:left|right)|data-\[side=(?:left|right)\]|\[data-side=(?:left|right)\]/;

// Slide animations under direction-resolved contexts are correct as-is:
// Radix flips `side`/`motion` values itself under DirectionProvider.
const DIRECTION_RESOLVED_VARIANT = /data-\[motion[=^]/;

const SLIDE_PREFIXES = ["slide-in-from-left", "slide-in-from-right", "slide-out-to-left", "slide-out-to-right"];

function loadAllowlist() {
  if (!existsSync(allowlistPath)) {
    return new Set();
  }
  return new Set(
    readFileSync(allowlistPath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#")),
  );
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else if (/\.tsx?$/.test(entry.name)) {
      yield path;
    }
  }
}

// Split a class token into [variant, value, modifier], colon/slash-aware of
// brackets and parens (arbitrary values like data-[side=left] or calc(...)).
function splitClassName(token) {
  const segments = [];
  let current = "";
  let depth = 0;
  for (const char of token) {
    if (char === "[" || char === "(") {
      depth++;
    } else if (char === "]" || char === ")") {
      depth--;
    }
    if (char === ":" && depth === 0) {
      segments.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  segments.push(current);
  let value = segments.pop() ?? "";
  const variant = segments.length > 0 ? segments.join(":") : null;
  let modifier = null;
  depth = 0;
  let slashIndex = -1;
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    if (char === "[" || char === "(") {
      depth++;
    } else if (char === "]" || char === ")") {
      depth--;
    } else if (char === "/" && depth === 0) {
      slashIndex = index;
    }
  }
  if (slashIndex !== -1) {
    modifier = value.slice(slashIndex + 1);
    value = value.slice(0, slashIndex);
  }
  return [variant, value, modifier];
}

// Extract string/template literal contents with their line numbers.
function* stringLiterals(content) {
  const pattern = /"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g;
  for (const match of content.matchAll(pattern)) {
    const text = match[1] ?? match[2] ?? match[3] ?? "";
    const line = content.slice(0, match.index).split("\n").length;
    yield { text, line };
  }
}

// A token satisfies an "rtl companion" requirement when the same file has a
// token whose variants include `rtl` and whose value matches. Variant order
// differs between authors, so this stays deliberately loose — the Storybook
// RTL pass is the exactness check.
function hasRtlCompanion(fileTokens, expectedValue) {
  return fileTokens.some(({ variant, value }) => {
    if (!variant) {
      return false;
    }
    const variants = variant.split(":");
    if (!variants.includes("rtl")) {
      return false;
    }
    return value === expectedValue || value.startsWith(expectedValue);
  });
}

function collectTokens(content) {
  const tokens = [];
  for (const { text, line } of stringLiterals(content)) {
    for (const raw of text.split(/\s+/)) {
      if (!raw || raw.includes("${")) {
        continue;
      }
      const token = raw.endsWith("!") ? raw.slice(0, -1) : raw;
      const [variant, value, modifier] = splitClassName(token);
      if (!value) {
        continue;
      }
      tokens.push({ raw, token, variant, value, modifier, line });
    }
  }
  return tokens;
}

function auditFile(path) {
  const content = readFileSync(path, "utf8");
  const tokens = collectTokens(content);
  const violations = [];

  for (const { raw, token, variant, value, line } of tokens) {
    if (token.startsWith("rtl:") || token.startsWith("ltr:")) {
      continue;
    }
    const variants = variant ? variant.split(":") : [];
    if (variants.includes("rtl") || variants.includes("ltr")) {
      continue;
    }

    const isPhysicalSideVariant = variant !== null && PHYSICAL_SIDE_VARIANT.test(variant);
    if (isPhysicalSideVariant) {
      continue;
    }

    // translate-x needs an rtl:-negated companion somewhere in the file.
    const translateMapping = RTL_TRANSLATE_X_MAPPINGS.find(([physical]) => value.startsWith(physical));
    if (translateMapping) {
      // ±0 is direction-neutral — negating it changes nothing.
      if (/^-?translate-x-0$/.test(value)) {
        continue;
      }
      const expected = value.replace(translateMapping[0], translateMapping[1]);
      if (!hasRtlCompanion(tokens, expected)) {
        violations.push({ line, raw, suggestion: `thêm rtl:${expected} (hoặc rtl:…:${expected})` });
      }
      continue;
    }

    // space-x/divide-x need an rtl:*-reverse companion.
    const reverseMapping = RTL_REVERSE_MAPPINGS.find(
      ([prefix]) => value.startsWith(prefix) || value.startsWith(`-${prefix}`),
    );
    if (reverseMapping) {
      if (value.includes("reverse")) {
        continue;
      }
      if (!hasRtlCompanion(tokens, reverseMapping[1])) {
        violations.push({ line, raw, suggestion: `thêm rtl:${reverseMapping[1]}` });
      }
      continue;
    }

    // Directional resize cursors need an rtl: swapped companion.
    const swapMapping = RTL_SWAP_MAPPINGS.find(([physical]) => value === physical);
    if (swapMapping) {
      if (!hasRtlCompanion(tokens, swapMapping[1])) {
        violations.push({ line, raw, suggestion: `thêm rtl:${swapMapping[1]}` });
      }
      continue;
    }

    // Physical slides are only safe under a direction-resolved context.
    if (SLIDE_PREFIXES.some((prefix) => value.startsWith(prefix))) {
      if (variant && DIRECTION_RESOLVED_VARIANT.test(variant)) {
        continue;
      }
      violations.push({ line, raw, suggestion: "kiểm tra: slide vật lý ngoài ngữ cảnh side/motion" });
      continue;
    }

    // Direct physical → logical replacements.
    for (const [physical, logical] of RTL_MAPPINGS) {
      if (!value.startsWith(physical)) {
        continue;
      }
      // Bare patterns (no trailing dash) must match exactly so border-ring
      // doesn't match border-r.
      if (!physical.endsWith("-") && value !== physical) {
        continue;
      }
      violations.push({ line, raw, suggestion: value.replace(physical, logical) });
      break;
    }
  }

  return violations;
}

const allowlist = loadAllowlist();
let total = 0;
let allowed = 0;

for (const path of walk(sourceRoot)) {
  const relativePath = relative(packageRoot, path);
  const violations = auditFile(path).filter(({ raw }) => {
    const isAllowed = allowlist.has(raw) || allowlist.has(`${relativePath}:${raw}`);
    if (isAllowed) {
      allowed++;
    }
    return !isAllowed;
  });
  if (violations.length === 0) {
    continue;
  }
  total += violations.length;
  console.log(`\n${relativePath}`);
  for (const { line, raw, suggestion } of violations) {
    console.log(`  ${line}: ${raw} → ${suggestion}`);
  }
}

if (total > 0) {
  console.log(`\n✖ ${total} vi phạm RTL${allowed > 0 ? ` (${allowed} trong allowlist)` : ""}`);
  process.exit(1);
}
console.log(`✓ Không còn class vật lý ngoài allowlist${allowed > 0 ? ` (${allowed} entry)` : ""}`);
