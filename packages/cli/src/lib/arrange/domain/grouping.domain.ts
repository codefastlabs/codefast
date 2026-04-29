import {
  BUCKET_ORDER,
  MAX_GROUPS_BASE,
  MAX_GROUPS_CAP,
  MAX_GROUPS_HEADROOM,
  MIN_GROUP_TOKENS,
} from "#/lib/arrange/domain/constants.domain";
import type { Bucket } from "#/lib/arrange/domain/types.domain";
import {
  bucketsCompatible,
  bucketsMergeCompatible,
  classifyToken,
  compositeSecondaryOrder,
  selectorKey,
  stateKey,
} from "#/lib/arrange/domain/tailwind-token-classifier.domain-service";
import {
  stripVariants,
  tokenizeClassString,
} from "#/lib/arrange/domain/tailwind-token.value-object";

/**
 * `cn()` grouping: bucket sequence is {@link BUCKET_ORDER} only; tokens are classified with
 * {@link classifyToken}. Comparators here (`compareClassifiedTailwindTokensForCnGrouping`, …)
 * are the single place for variant-aware sort — do not reintroduce parallel bucket ordering.
 */

/**
 * Separates bucket id from variant key in {@link buildFirstVariantKeySourceIndex} map keys.
 */
const VARIANT_BUCKET_KEY_SEP = "\u0000";

type ClassifiedTailwindToken = {
  readonly classToken: string;
  readonly bucket: Bucket;
  readonly index: number;
};

function isVariantKeyedBucket(bucket: Bucket): bucket is "selector" | "state" | "starting" {
  return bucket === "selector" || bucket === "state" || bucket === "starting";
}

function variantGroupKey(bucket: Bucket, classToken: string): string {
  return bucket === "selector" ? selectorKey(classToken) : stateKey(classToken);
}

function variantKeyedBlockMapKey(bucket: Bucket, classToken: string): string {
  return `${bucket}${VARIANT_BUCKET_KEY_SEP}${variantGroupKey(bucket, classToken)}`;
}

/**
 * Deterministic lexicographic order for Tailwind class tokens (and token-space signatures).
 * Used wherever we need stable, locale-agnostic ASCII ordering of utility strings.
 */
function compareClassTokensCanonically(left: string, right: string): number {
  return left.localeCompare(right);
}

/**
 * First source index where each `(bucket, variantGroupKey)` appears — drives stable clustering
 * in {@link suggestCnGroups} without reordering unrelated variant blocks by alphabet alone.
 */
function buildFirstVariantKeySourceIndex(
  classified: readonly ClassifiedTailwindToken[],
): Map<string, number> {
  const firstVariantKeySourceIndex = new Map<string, number>();
  for (const item of classified) {
    if (!isVariantKeyedBucket(item.bucket)) {
      continue;
    }
    const mapKey = variantKeyedBlockMapKey(item.bucket, item.classToken);
    const prior = firstVariantKeySourceIndex.get(mapKey);
    if (prior === undefined || item.index < prior) {
      firstVariantKeySourceIndex.set(mapKey, item.index);
    }
  }
  return firstVariantKeySourceIndex;
}

function compareClassifiedTailwindTokensForCnGrouping(
  left: ClassifiedTailwindToken,
  right: ClassifiedTailwindToken,
  firstVariantKeySourceIndex: ReadonlyMap<string, number>,
): number {
  const bucketOrderDiff = BUCKET_ORDER[left.bucket] - BUCKET_ORDER[right.bucket];
  if (bucketOrderDiff !== 0) {
    return bucketOrderDiff;
  }
  if (left.bucket === "composite" && right.bucket === "composite") {
    const compositeOrderDiff =
      compositeSecondaryOrder(stripVariants(left.classToken)) -
      compositeSecondaryOrder(stripVariants(right.classToken));
    if (compositeOrderDiff !== 0) {
      return compositeOrderDiff;
    }
    return left.index - right.index;
  }
  if (isVariantKeyedBucket(left.bucket) && isVariantKeyedBucket(right.bucket)) {
    const leftMapKey = variantKeyedBlockMapKey(left.bucket, left.classToken);
    const rightMapKey = variantKeyedBlockMapKey(right.bucket, right.classToken);
    const leftBlockStart = firstVariantKeySourceIndex.get(leftMapKey);
    const rightBlockStart = firstVariantKeySourceIndex.get(rightMapKey);
    if (leftBlockStart === undefined || rightBlockStart === undefined) {
      throw new Error("invariant: variant-keyed token missing block start index");
    }
    if (leftBlockStart !== rightBlockStart) {
      return leftBlockStart - rightBlockStart;
    }
    const variantKeyCompare = compareClassTokensCanonically(
      variantGroupKey(left.bucket, left.classToken),
      variantGroupKey(right.bucket, right.classToken),
    );
    if (variantKeyCompare !== 0) {
      return variantKeyCompare;
    }
    return compareClassTokensCanonically(left.classToken, right.classToken);
  }
  return left.index - right.index;
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
        const classTokens = tokenizeClassString(chunk);
        return classTokens.length === 0
          ? ""
          : [...classTokens].sort(compareClassTokensCanonically).join(" ");
      })
      .filter((s) => s.length > 0)
      .sort(compareClassTokensCanonically);

  const staticPartitionSigs = partitionSignatures(staticLiteralTexts);
  const suggestedPartitionSigs = partitionSignatures(suggestedGroups);
  if (staticPartitionSigs.length !== suggestedPartitionSigs.length) {
    return false;
  }
  for (let i = 0; i < staticPartitionSigs.length; i++) {
    if (staticPartitionSigs[i] !== suggestedPartitionSigs[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Dominant bucket of a whitespace-delimited class group (for merge heuristics).
 */
function dominantBucketOfGroup(groupStr: string): Bucket {
  const counts = new Map<Bucket, number>();
  for (const classToken of tokenizeClassString(groupStr)) {
    const tokenBucket = classifyToken(classToken);
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

/**
 * Dynamic cap: more tokens → allow more groups, within [BASE, CAP].
 */
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
function mergeSingletons(groups: string[]): string[] {
  if (groups.length <= 1) {
    return groups;
  }
  const result = [...groups];

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      const groupAtI = result[i];
      if (groupAtI === undefined) {
        throw new Error("invariant: mergeSingletons group missing");
      }
      if (tokenizeClassString(groupAtI).length < MIN_GROUP_TOKENS) {
        if (result.length === 1) {
          break;
        }
        const myBucket = dominantBucketOfGroup(groupAtI);
        const prevGroup = i > 0 ? result[i - 1] : undefined;
        const nextGroup = i < result.length - 1 ? result[i + 1] : undefined;
        const prevCompat =
          prevGroup !== undefined &&
          bucketsMergeCompatible(myBucket, dominantBucketOfGroup(prevGroup));
        const nextCompat =
          nextGroup !== undefined &&
          bucketsMergeCompatible(myBucket, dominantBucketOfGroup(nextGroup));

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
          if (nextGroup === undefined) {
            throw new Error("invariant: forward merge missing right group");
          }
          result[i + 1] = `${groupAtI} ${nextGroup}`;
        } else {
          if (prevGroup === undefined) {
            throw new Error("invariant: backward merge missing left group");
          }
          result[i - 1] = `${prevGroup} ${groupAtI}`;
        }
        result.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  return result;
}

/**
 * Tie-break when two merge candidates are both {@link bucketsMergeCompatible} (same bucket or COMPATIBLE_BUCKET_SETS).
 */
function capMergePenalty(leftBucket: Bucket, rightBucket: Bucket): number {
  if (leftBucket === rightBucket) {
    return 0;
  }
  if (bucketsCompatible(leftBucket, rightBucket)) {
    return 0;
  }
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
function capGroups(groups: string[], maxGroups: number): string[] {
  const result = [...groups];
  const lengths = result.map((groupStr) => tokenizeClassString(groupStr).length);

  while (result.length > maxGroups) {
    type MergePairCandidate = { i: number; size: number; penalty: number };
    const mergePairCandidates: MergePairCandidate[] = [];
    for (let i = 0; i < result.length - 1; i++) {
      const leftGroup = result[i];
      const rightGroup = result[i + 1];
      const leftLen = lengths[i];
      const rightLen = lengths[i + 1];
      if (
        leftGroup === undefined ||
        rightGroup === undefined ||
        leftLen === undefined ||
        rightLen === undefined
      ) {
        throw new Error("invariant: capGroups adjacent pair missing");
      }
      const dominantLeft = dominantBucketOfGroup(leftGroup);
      const dominantRight = dominantBucketOfGroup(rightGroup);
      if (!bucketsMergeCompatible(dominantLeft, dominantRight)) {
        continue;
      }
      mergePairCandidates.push({
        i,
        size: leftLen + rightLen,
        penalty: capMergePenalty(dominantLeft, dominantRight),
      });
    }
    if (mergePairCandidates.length === 0) {
      break;
    }

    const firstCandidate = mergePairCandidates[0];
    if (firstCandidate === undefined) {
      throw new Error("invariant: merge candidates empty");
    }
    let best = firstCandidate;
    for (const candidate of mergePairCandidates) {
      if (
        candidate.penalty < best.penalty ||
        (candidate.penalty === best.penalty && candidate.size < best.size)
      ) {
        best = candidate;
      }
    }
    const bestIdx = best.i;
    const leftMerge = result[bestIdx];
    const rightMerge = result[bestIdx + 1];
    const leftMergeLen = lengths[bestIdx];
    const rightMergeLen = lengths[bestIdx + 1];
    if (
      leftMerge === undefined ||
      rightMerge === undefined ||
      leftMergeLen === undefined ||
      rightMergeLen === undefined
    ) {
      throw new Error("invariant: capGroups best merge pair missing");
    }
    result[bestIdx] = `${leftMerge} ${rightMerge}`;
    lengths[bestIdx] = leftMergeLen + rightMergeLen;
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
function mergeEaseTimingIntoFollowingAnimatedState(groups: string[]): string[] {
  const result = [...groups];
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      const chunkI = result[i];
      if (chunkI === undefined) {
        throw new Error("invariant: mergeEase chunk missing");
      }
      if (!chunkIsOnlyEaseTimingMotion(chunkI)) {
        continue;
      }
      const easeStr = chunkI;
      let target = -1;
      for (let j = i + 1; j < result.length; j++) {
        const chunkJ = result[j];
        if (chunkJ === undefined) {
          throw new Error("invariant: mergeEase following chunk missing");
        }
        if (dominantBucketOfGroup(chunkJ) !== "state") {
          continue;
        }
        const classTokens = tokenizeClassString(chunkJ);
        if (!classTokens.some((classToken) => /^animate/.test(stripVariants(classToken)))) {
          continue;
        }
        target = j;
        break;
      }
      if (target === -1) {
        continue;
      }
      const targetChunk = result[target];
      if (targetChunk === undefined) {
        throw new Error("invariant: mergeEase target chunk missing");
      }
      result[target] = `${easeStr} ${targetChunk}`.trim();
      result.splice(i, 1);
      changed = true;
      break;
    }
  }
  return result;
}

function chunkIsOnlyEaseTimingMotion(groupStr: string): boolean {
  const classTokens = tokenizeClassString(groupStr);
  if (classTokens.length === 0) {
    return false;
  }
  return classTokens.every(
    (classToken) =>
      classifyToken(classToken) === "motion" && /^ease-/.test(stripVariants(classToken)),
  );
}

export function suggestCnGroups(classString: string): string[] {
  const tokens = tokenizeClassString(classString);
  if (tokens.length === 0) {
    return [];
  }

  /**
   * Variant-keyed buckets (`state`, `starting`, `selector`): after global bucket ordering,
   * cluster tokens that share the same {@link variantGroupKey} so the same modifier stack
   * (e.g. `focus-visible:`) merges one `cn()` arg regardless of interleaved unrelated
   * variants. Block order follows the **first source index** of each key so unrelated
   * states keep document order; within a key, `classToken` order is lexicographic for
   * idempotency.
   */
  const classified: ClassifiedTailwindToken[] = tokens.map((classToken, index) => ({
    classToken,
    bucket: classifyToken(classToken),
    index,
  }));

  const firstVariantKeySourceIndex = buildFirstVariantKeySourceIndex(classified);
  classified.sort((left, right) =>
    compareClassifiedTailwindTokensForCnGrouping(left, right, firstVariantKeySourceIndex),
  );

  const rawGroups: string[] = [];
  /**
   * Bucket of the last token already placed in the current run (pairwise compat with `COMPATIBLE_BUCKET_SETS`).
   */
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

  for (const { classToken, bucket: tokenBucket } of classified) {
    if (lastBucketInRun === null) {
      lastBucketInRun = tokenBucket;
      currentStateKey = isVariantKeyedBucket(tokenBucket)
        ? variantGroupKey(tokenBucket, classToken)
        : null;
      currentTokens.push(classToken);
      continue;
    }

    if (isVariantKeyedBucket(tokenBucket)) {
      const key = variantGroupKey(tokenBucket, classToken);
      if (currentStateKey !== null && key !== currentStateKey) {
        flush();
        lastBucketInRun = tokenBucket;
        currentStateKey = key;
        currentTokens.push(classToken);
        continue;
      }
    }

    if (!bucketsCompatible(tokenBucket, lastBucketInRun)) {
      flush();
      lastBucketInRun = tokenBucket;
      currentStateKey = isVariantKeyedBucket(tokenBucket)
        ? variantGroupKey(tokenBucket, classToken)
        : null;
      currentTokens.push(classToken);
      continue;
    }

    if (isVariantKeyedBucket(tokenBucket)) {
      currentStateKey = variantGroupKey(tokenBucket, classToken);
    } else if (currentStateKey !== null) {
      // Defensive reset: keeps state-key logic explicit if bucket rules evolve.
      currentStateKey = null;
    }

    lastBucketInRun = tokenBucket;
    currentTokens.push(classToken);
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
    if (uniq.size !== 1) {
      return `mixed:${[...uniq].sort(compareClassTokensCanonically).join("+")}`;
    }
    const onlyBucket = [...uniq][0];
    if (onlyBucket === undefined) {
      return `mixed:${[...uniq].sort(compareClassTokensCanonically).join("+")}`;
    }
    return onlyBucket;
  });
}
