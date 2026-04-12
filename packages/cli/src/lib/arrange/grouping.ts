import {
  BUCKET_ORDER,
  MAX_GROUPS_BASE,
  MAX_GROUPS_CAP,
  MAX_GROUPS_HEADROOM,
  MIN_GROUP_TOKENS,
} from "#lib/arrange/constants";
import type { Bucket } from "#lib/arrange/types";
import {
  bucketsCompatible,
  bucketsMergeCompatible,
  classifyToken,
  stateKey,
  tokenizeClassString,
} from "#lib/arrange/tokenizer";

/**
 * True when `staticLiteralTexts` carries the **same partition** of Tailwind tokens as
 * `suggestedGroups` from {@link suggestCnGroups}, ignoring order of arguments and
 * order of tokens within each chunk.
 */
export function areCnTailwindPartitionsEquivalent(
  staticLiteralTexts: string[],
  suggestedGroups: string[],
): boolean {
  const partitionSignatures = (chunks: string[]): string[] =>
    chunks
      .map((chunk) => {
        const toks = tokenizeClassString(chunk);
        return toks.length === 0 ? "" : [...toks].sort().join(" ");
      })
      .filter((s) => s.length > 0)
      .sort((a, b) => a.localeCompare(b));

  const a = partitionSignatures(staticLiteralTexts);
  const b = partitionSignatures(suggestedGroups);
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Dominant bucket of a whitespace-delimited class group (for merge heuristics). */
function dominantBucketOfGroup(g: string): Bucket {
  const counts = new Map<Bucket, number>();
  for (const tok of tokenizeClassString(g)) {
    const b = classifyToken(tok);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  let best: Bucket = "other";
  let bestN = 0;
  for (const [b, n] of counts) {
    if (n > bestN) {
      best = b;
      bestN = n;
    }
  }
  return best;
}

/** Dynamic cap: more tokens → allow more groups, within [BASE, CAP]. */
function dynamicMaxGroups(tokenCount: number): number {
  const byTokens = Math.ceil(tokenCount / 2) + MAX_GROUPS_HEADROOM;
  return Math.max(MAX_GROUPS_BASE, Math.min(MAX_GROUPS_CAP, byTokens));
}

/**
 * Merge singleton groups (< MIN_GROUP_TOKENS tokens) into their nearest
 * neighbour. Prefers merging toward a bucket-compatible neighbor.
 */
export function mergeSingletons(groups: string[]): string[] {
  if (groups.length <= 1) return groups;
  const result = [...groups];

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      if (tokenizeClassString(result[i]).length < MIN_GROUP_TOKENS) {
        if (result.length === 1) break;
        const myBucket = dominantBucketOfGroup(result[i]);

        const prevCompat =
          i > 0 && bucketsMergeCompatible(myBucket, dominantBucketOfGroup(result[i - 1]));
        const nextCompat =
          i < result.length - 1 &&
          bucketsMergeCompatible(myBucket, dominantBucketOfGroup(result[i + 1]));

        let mergeDir: "forward" | "backward";
        if (nextCompat && !prevCompat) {
          mergeDir = "forward";
        } else if (prevCompat && !nextCompat) {
          mergeDir = "backward";
        } else if (prevCompat && nextCompat) {
          mergeDir = i < result.length - 1 ? "forward" : "backward";
        } else {
          continue;
        }

        if (mergeDir === "forward") {
          result[i + 1] = result[i] + " " + result[i + 1];
        } else {
          result[i - 1] = result[i - 1] + " " + result[i];
        }
        result.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  return result;
}

function capMergePenalty(a: Bucket, b: Bucket): number {
  if (a === "state" && b === "state") return 1_000;
  if (a === "state" || b === "state") return 350;

  const hi = 100;
  const set = new Set([a, b]);
  if (set.has("surface") && set.has("typography")) return hi;
  if (set.has("typography") && set.has("interaction")) return hi;
  if (set.has("typography") && set.has("motion")) return hi;
  if (set.has("spacing") && set.has("typography")) return hi - 5;
  if (set.has("spacing") && set.has("surface")) return hi - 10;
  if (set.has("layout") && set.has("spacing")) return hi - 8;
  if (set.has("arbitrary")) return 60;
  return 0;
}

/**
 * Merge adjacent groups until total count ≤ maxGroups.
 * Prefers bucket-compatible pairs, then lowest merge penalty, then smaller size.
 */
export function capGroups(groups: string[], maxGroups: number): string[] {
  const result = [...groups];
  const lengths = result.map((g) => tokenizeClassString(g).length);

  while (result.length > maxGroups) {
    type Cand = { i: number; size: number; compat: boolean; penalty: number };
    const cands: Cand[] = [];
    for (let i = 0; i < result.length - 1; i++) {
      const d0 = dominantBucketOfGroup(result[i]);
      const d1 = dominantBucketOfGroup(result[i + 1]);
      const compat = bucketsMergeCompatible(d0, d1);
      cands.push({
        i,
        size: lengths[i] + lengths[i + 1],
        compat,
        penalty: compat ? 0 : capMergePenalty(d0, d1),
      });
    }
    const preferred = cands.filter((c) => c.compat);
    const pool = preferred.length > 0 ? preferred : cands;
    let best = pool[0]!;
    for (const c of pool) {
      if (c.penalty < best.penalty || (c.penalty === best.penalty && c.size < best.size)) {
        best = c;
      }
    }
    const bestIdx = best.i;
    result[bestIdx] = result[bestIdx] + " " + result[bestIdx + 1];
    lengths[bestIdx] = lengths[bestIdx] + lengths[bestIdx + 1];
    result.splice(bestIdx + 1, 1);
    lengths.splice(bestIdx + 1, 1);
  }
  return result;
}

export function suggestCnGroups(classString: string): string[] {
  const tokens = tokenizeClassString(classString);
  if (tokens.length === 0) return [];

  const classified = tokens.map((tok, index) => ({ tok, bucket: classifyToken(tok), index }));
  classified.sort((a, b) => {
    const od = BUCKET_ORDER[a.bucket] - BUCKET_ORDER[b.bucket];
    return od !== 0 ? od : a.index - b.index;
  });

  const rawGroups: string[] = [];
  let currentBucket: Bucket | null = null;
  let currentStateKey: string | null = null;
  let currentTokens: string[] = [];

  const flush = (): void => {
    if (currentTokens.length > 0) {
      rawGroups.push(currentTokens.join(" "));
      currentTokens = [];
    }
  };

  for (const { tok, bucket: b } of classified) {
    if (currentBucket === null) {
      currentBucket = b;
      currentStateKey = b === "state" ? stateKey(tok) : null;
      currentTokens.push(tok);
      continue;
    }

    if (!bucketsCompatible(b, currentBucket)) {
      flush();
      currentBucket = b;
      currentStateKey = b === "state" ? stateKey(tok) : null;
      currentTokens.push(tok);
      continue;
    }

    if (b === "state") {
      const key = stateKey(tok);
      if (key !== currentStateKey) {
        flush();
        currentBucket = b;
        currentStateKey = key;
      }
    } else if (currentBucket !== b) {
      currentBucket = b;
    }

    currentTokens.push(tok);
  }
  flush();

  const merged = mergeSingletons(rawGroups);

  return capGroups(merged, dynamicMaxGroups(tokens.length));
}
