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

function capMergePenalty(leftBucket: Bucket, rightBucket: Bucket): number {
  if (leftBucket === "state" && rightBucket === "state") return 1_000;
  if (leftBucket === "state" || rightBucket === "state") return 350;

  const hi = 100;
  const set = new Set([leftBucket, rightBucket]);
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
  const lengths = result.map((groupStr) => tokenizeClassString(groupStr).length);

  while (result.length > maxGroups) {
    type Cand = { i: number; size: number; compat: boolean; penalty: number };
    const cands: Cand[] = [];
    for (let i = 0; i < result.length - 1; i++) {
      const dominantLeft = dominantBucketOfGroup(result[i]);
      const dominantRight = dominantBucketOfGroup(result[i + 1]);
      const compat = bucketsMergeCompatible(dominantLeft, dominantRight);
      cands.push({
        i,
        size: lengths[i] + lengths[i + 1],
        compat,
        penalty: compat ? 0 : capMergePenalty(dominantLeft, dominantRight),
      });
    }
    const preferred = cands.filter((candidate) => candidate.compat);
    const pool = preferred.length > 0 ? preferred : cands;
    let best = pool[0]!;
    for (const candidate of pool) {
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

export function suggestCnGroups(classString: string): string[] {
  const tokens = tokenizeClassString(classString);
  if (tokens.length === 0) return [];

  const classified = tokens.map((tok, index) => ({ tok, bucket: classifyToken(tok), index }));
  classified.sort((left, right) => {
    const bucketOrderDiff = BUCKET_ORDER[left.bucket] - BUCKET_ORDER[right.bucket];
    return bucketOrderDiff !== 0 ? bucketOrderDiff : left.index - right.index;
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

  for (const { tok, bucket: tokenBucket } of classified) {
    if (currentBucket === null) {
      currentBucket = tokenBucket;
      currentStateKey = tokenBucket === "state" ? stateKey(tok) : null;
      currentTokens.push(tok);
      continue;
    }

    if (!bucketsCompatible(tokenBucket, currentBucket)) {
      flush();
      currentBucket = tokenBucket;
      currentStateKey = tokenBucket === "state" ? stateKey(tok) : null;
      currentTokens.push(tok);
      continue;
    }

    if (tokenBucket === "state") {
      const key = stateKey(tok);
      if (key !== currentStateKey) {
        flush();
        currentBucket = tokenBucket;
        currentStateKey = key;
      }
    } else if (currentBucket !== tokenBucket) {
      currentBucket = tokenBucket;
    }

    currentTokens.push(tok);
  }
  flush();

  const merged = mergeSingletons(rawGroups);

  return capGroups(merged, dynamicMaxGroups(tokens.length));
}
