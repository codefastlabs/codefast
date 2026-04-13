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
  compositeSecondaryOrder,
  selectorKey,
  stateKey,
  stripVariants,
  tokenizeClassString,
} from "#lib/arrange/tokenizer";

function isVariantKeyedBucket(bucket: Bucket): bucket is "selector" | "state" | "starting" {
  return bucket === "selector" || bucket === "state" || bucket === "starting";
}

function variantGroupKey(bucket: Bucket, tok: string): string {
  return bucket === "selector" ? selectorKey(tok) : stateKey(tok);
}

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

  const staticPartitionSigs = partitionSignatures(staticLiteralTexts);
  const suggestedPartitionSigs = partitionSignatures(suggestedGroups);
  if (staticPartitionSigs.length !== suggestedPartitionSigs.length) return false;
  for (let i = 0; i < staticPartitionSigs.length; i++) {
    if (staticPartitionSigs[i] !== suggestedPartitionSigs[i]) return false;
  }
  return true;
}

/** Dominant bucket of a whitespace-delimited class group (for merge heuristics). */
function dominantBucketOfGroup(groupStr: string): Bucket {
  const counts = new Map<Bucket, number>();
  for (const tok of tokenizeClassString(groupStr)) {
    const tokenBucket = classifyToken(tok);
    counts.set(tokenBucket, (counts.get(tokenBucket) ?? 0) + 1);
  }
  let best: Bucket = "other";
  let bestN = 0;
  for (const [bucket, count] of counts) {
    if (count > bestN) {
      best = bucket;
      bestN = count;
      continue;
    }
    // Deterministic tie-break: prefer earlier render-pipeline bucket.
    if (count === bestN && BUCKET_ORDER[bucket] < BUCKET_ORDER[best]) {
      best = bucket;
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
 *
 * Loop termination: each iteration either splices one element (shrinking the
 * array, guaranteeing progress) or finds no singleton that can merge and exits
 * via `changed = false`. Two mutually-incompatible singletons both hit
 * `continue` and `changed` stays false, so the loop exits without spinning.
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

/** Tie-break when two merge candidates are both {@link bucketsMergeCompatible} (same bucket or COMPATIBLE_BUCKET_SETS). */
function capMergePenalty(leftBucket: Bucket, rightBucket: Bucket): number {
  if (leftBucket === rightBucket) return 0;
  if (bucketsCompatible(leftBucket, rightBucket)) return 0;
  return 500;
}

/**
 * Merge adjacent groups until total count ≤ maxGroups.
 * Only merges pairs allowed by {@link bucketsMergeCompatible} — never glues incompatible
 * buckets (which previously defaulted to penalty 0 and merged layout+state when over cap).
 *
 * Complexity: O(n²) in the number of groups — each merge pass scans all remaining adjacent
 * pairs. In practice `n` is bounded by {@link MAX_GROUPS_CAP} (24) and typical class strings
 * are well below that, so this is not a concern for the current usage pattern. If this ever
 * runs in a high-throughput batch mode, consider a priority-queue approach.
 */
export function capGroups(groups: string[], maxGroups: number): string[] {
  const result = [...groups];
  const lengths = result.map((groupStr) => tokenizeClassString(groupStr).length);

  while (result.length > maxGroups) {
    type Cand = { i: number; size: number; penalty: number };
    const cands: Cand[] = [];
    for (let i = 0; i < result.length - 1; i++) {
      const dominantLeft = dominantBucketOfGroup(result[i]);
      const dominantRight = dominantBucketOfGroup(result[i + 1]);
      if (!bucketsMergeCompatible(dominantLeft, dominantRight)) continue;
      cands.push({
        i,
        size: lengths[i] + lengths[i + 1],
        penalty: capMergePenalty(dominantLeft, dominantRight),
      });
    }
    if (cands.length === 0) break;

    let best = cands[0]!;
    for (const candidate of cands) {
      if (
        candidate.penalty < best.penalty ||
        (candidate.penalty === best.penalty && candidate.size < best.size)
      ) {
        best = candidate;
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

/**
 * If a chunk is **only** bare `ease-*` timing (Motion), buffer it and prepend to the **first**
 * **later** chunk that is predominantly `state` **and** contains some `animate-*` utility —
 * skipping intermediate `state` chunks (`sm:…`, `group-data-[…]:…`, etc.) that sit between
 * `ease-ui` and `data-open:animate-*`. If no such chunk exists, the ease chunk is left as-is.
 */
export function mergeEaseTimingIntoFollowingAnimatedState(groups: string[]): string[] {
  const result = [...groups];
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      if (!chunkIsOnlyEaseTimingMotion(result[i]!)) continue;
      const easeStr = result[i]!;
      let target = -1;
      for (let j = i + 1; j < result.length; j++) {
        if (dominantBucketOfGroup(result[j]!) !== "state") continue;
        const toks = tokenizeClassString(result[j]!);
        if (!toks.some((t) => /^animate/.test(stripVariants(t)))) continue;
        target = j;
        break;
      }
      if (target === -1) continue;
      result[target] = `${easeStr} ${result[target]!}`.trim();
      result.splice(i, 1);
      changed = true;
      break;
    }
  }
  return result;
}

function chunkIsOnlyEaseTimingMotion(groupStr: string): boolean {
  const toks = tokenizeClassString(groupStr);
  if (toks.length === 0) return false;
  return toks.every((t) => classifyToken(t) === "motion" && /^ease-/.test(stripVariants(t)));
}

export function suggestCnGroups(classString: string): string[] {
  const tokens = tokenizeClassString(classString);
  if (tokens.length === 0) return [];

  const classified = tokens.map((tok, index) => ({ tok, bucket: classifyToken(tok), index }));
  classified.sort((left, right) => {
    const bucketOrderDiff = BUCKET_ORDER[left.bucket] - BUCKET_ORDER[right.bucket];
    if (bucketOrderDiff !== 0) return bucketOrderDiff;
    if (left.bucket === "composite" && right.bucket === "composite") {
      const c =
        compositeSecondaryOrder(stripVariants(left.tok)) -
        compositeSecondaryOrder(stripVariants(right.tok));
      if (c !== 0) return c;
    }
    return left.index - right.index;
  });

  const rawGroups: string[] = [];
  /** Bucket of the last token already placed in the current run (pairwise compat with `COMPATIBLE_BUCKET_SETS`). */
  let lastBucketInRun: Bucket | null = null;
  let currentStateKey: string | null = null;
  let currentTokens: string[] = [];

  const flush = (): void => {
    if (currentTokens.length > 0) {
      rawGroups.push(currentTokens.join(" "));
      currentTokens = [];
    }
    lastBucketInRun = null;
    currentStateKey = null;
  };

  for (const { tok, bucket: tokenBucket } of classified) {
    if (lastBucketInRun === null) {
      lastBucketInRun = tokenBucket;
      currentStateKey = isVariantKeyedBucket(tokenBucket)
        ? variantGroupKey(tokenBucket, tok)
        : null;
      currentTokens.push(tok);
      continue;
    }

    if (isVariantKeyedBucket(tokenBucket)) {
      const key = variantGroupKey(tokenBucket, tok);
      if (currentStateKey !== null && key !== currentStateKey) {
        flush();
        lastBucketInRun = tokenBucket;
        currentStateKey = key;
        currentTokens.push(tok);
        continue;
      }
    }

    if (!bucketsCompatible(tokenBucket, lastBucketInRun)) {
      flush();
      lastBucketInRun = tokenBucket;
      currentStateKey = isVariantKeyedBucket(tokenBucket)
        ? variantGroupKey(tokenBucket, tok)
        : null;
      currentTokens.push(tok);
      continue;
    }

    if (isVariantKeyedBucket(tokenBucket)) {
      currentStateKey = variantGroupKey(tokenBucket, tok);
    } else if (currentStateKey !== null) {
      // Defensive reset: keeps state-key logic explicit if bucket rules evolve.
      currentStateKey = null;
    }

    lastBucketInRun = tokenBucket;
    currentTokens.push(tok);
  }
  flush();

  const merged = mergeSingletons(rawGroups);
  const withEaseMerged = mergeEaseTimingIntoFollowingAnimatedState(merged);
  // Never cap-merge below the semantic chunk count from the tokenizer (fixes layout+state glued
  // when `preferred` compat list was empty and unrelated pairs used penalty 0).
  const maxAllowed = Math.max(dynamicMaxGroups(tokens.length), withEaseMerged.length);

  return capGroups(withEaseMerged, maxAllowed);
}

/**
 * One label per suggested group: a single bucket name, or `mixed:a+b` when that chunk
 * spans multiple Tailwind buckets (matches `codefast arrange group` stdout).
 */
export function summarizeGroupBucketLabels(groups: string[]): string[] {
  return groups.map((g) => {
    const uniq = new Set(tokenizeClassString(g).map(classifyToken));
    return uniq.size === 1 ? [...uniq][0]! : `mixed:${[...uniq].sort().join("+")}`;
  });
}
