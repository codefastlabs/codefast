/**
 * Why the container picked the binding it picked, derived and then checked against the real resolve.
 *
 * @remarks The verdicts here mirror SPEC §5.11. They are a *model* of the engine, so every decision
 * also records whether the model agreed with what `resolve()` actually returned — a disagreement is
 * shown rather than hidden, because a trace nobody can falsify is decoration.
 */
import type { Container, Token } from "@codefast/di";
import { DiError } from "@codefast/di";

import type { CatalogEntry, SlotTags } from "#/features/inspector/server/catalog";

/** The request as it crosses to the client: tag values are rendered, because `unknown` is not serialisable. */
export interface RequestView {
  readonly name?: string;
  readonly tags: ReadonlyArray<readonly [string, string]>;
}

/** The request as the container sees it, tag values still their real selves. */
export interface SlotRequest {
  readonly name?: string;
  readonly tags: SlotTags;
}

export type CandidateVerdict =
  | { readonly kind: "matched"; readonly tagCount: number }
  | { readonly kind: "guarded"; readonly tagCount: number; readonly guard: string }
  | { readonly kind: "rejected"; readonly because: string };

export interface CandidateView {
  readonly label: string;
  readonly slotLabel: string;
  readonly verdict: CandidateVerdict;
  readonly won: boolean;
}

/** Which rule settled a slot, in the order the engine applies them. */
export type DecidingRule = "sole candidate" | "predicate" | "more tags" | "ambiguous" | "no candidate";

export interface Decision {
  readonly token: string;
  readonly request: RequestView;
  readonly candidates: ReadonlyArray<CandidateView>;
  readonly winner: string | undefined;
  readonly rule: DecidingRule;
  /** What the container did with this request, when it refused to answer at all. */
  readonly error?: { readonly name: string; readonly message: string };
  /**
   * Whether the derived explanation matched the real resolve. `not predicted` is the honest answer
   * when a `when()` guard is in play: this model cannot evaluate a predicate, so it does not guess.
   */
  readonly check: "agrees" | "disagrees" | "not predicted";
}

const slotLabel = (slot: { name?: string; tags: SlotTags }): string => {
  const parts = [
    ...(slot.name === undefined ? [] : [`name:${slot.name}`]),
    ...slot.tags.map(([key, value]) => `${key}:${String(value)}`),
  ];

  return parts.length === 0 ? "default slot" : `{ ${parts.join(", ")} }`;
};

/** A slot matches when every tag it declares is named by the request (SPEC §5.11). */
function verdictFor(entry: CatalogEntry, request: SlotRequest): CandidateVerdict {
  const { name, tags } = entry.slot;

  if (name !== undefined && name !== request.name) {
    return { kind: "rejected", because: `wants name:${name}` };
  }
  if (name === undefined && request.name !== undefined) {
    return { kind: "rejected", because: "has no name slot" };
  }
  if (tags.length === 0 && request.tags.length > 0) {
    return { kind: "rejected", because: "untagged, and the request carries tags" };
  }

  for (const [key, value] of tags) {
    const requested = request.tags.find(([otherKey]) => otherKey === key);

    if (requested === undefined) {
      return { kind: "rejected", because: `request never names ${key}` };
    }
    if (!Object.is(requested[1], value)) {
      return { kind: "rejected", because: `wants ${key}:${String(value)}` };
    }
  }

  return entry.guard === undefined
    ? { kind: "matched", tagCount: tags.length }
    : { kind: "guarded", tagCount: tags.length, guard: entry.guard };
}

/** The entry the rules predict, plus which rule got there — computed without looking at the answer. */
function predict(
  matched: ReadonlyArray<CatalogEntry>,
  verdicts: Map<CatalogEntry, CandidateVerdict>,
): {
  entry: CatalogEntry | undefined;
  rule: DecidingRule;
  predictable: boolean;
} {
  if (matched.length === 0) {
    return { entry: undefined, rule: "no candidate", predictable: true };
  }
  if (matched.length === 1) {
    return { entry: matched[0], rule: "sole candidate", predictable: true };
  }

  // A guard can refuse as easily as it can accept, and evaluating one needs the live resolution
  // context this model does not have — so the rule is named and the winner is left to the engine.
  if (matched.some((entry) => entry.guard !== undefined)) {
    return { entry: undefined, rule: "predicate", predictable: false };
  }

  let best: CatalogEntry | undefined;
  let bestCount = -1;
  let tied = false;

  for (const entry of matched) {
    const verdict = verdicts.get(entry);
    const count = verdict !== undefined && verdict.kind !== "rejected" ? verdict.tagCount : 0;

    if (count > bestCount) {
      best = entry;
      bestCount = count;
      tied = false;
    } else if (count === bestCount) {
      tied = true;
    }
  }

  return tied
    ? { entry: undefined, rule: "ambiguous", predictable: true }
    : { entry: best, rule: "more tags", predictable: true };
}

/**
 * Runs one request for real and explains the slot it landed on, given every descriptor registered
 * under that token.
 */
export function explainSlot(
  container: Container,
  slotToken: Token<unknown>,
  tokenName: string,
  request: SlotRequest,
  entries: ReadonlyArray<CatalogEntry>,
): Decision {
  const verdicts = new Map<CatalogEntry, CandidateVerdict>();

  for (const entry of entries) {
    verdicts.set(entry, verdictFor(entry, request));
  }

  const matched = entries.filter((entry) => verdicts.get(entry)?.kind !== "rejected");
  const { entry: predicted, rule, predictable } = predict(matched, verdicts);

  let resolvedEntry: CatalogEntry | undefined;
  let error: Decision["error"];

  try {
    const options = request.name === undefined ? { tags: request.tags } : { name: request.name, tags: request.tags };
    const resolved = container.resolve(
      slotToken,
      request.tags.length === 0 && request.name === undefined ? undefined : options,
    );

    resolvedEntry = entries.find((entry) => entry.value === resolved);
  } catch (caught) {
    error = {
      name: caught instanceof DiError ? caught.constructor.name : "Error",
      message: caught instanceof Error ? caught.message : String(caught),
    };
  }

  const winner = resolvedEntry?.label;
  const check: Decision["check"] = !predictable
    ? "not predicted"
    : (error === undefined ? predicted?.id === resolvedEntry?.id : predicted === undefined)
      ? "agrees"
      : "disagrees";

  const requestView: RequestView = {
    ...(request.name === undefined ? {} : { name: request.name }),
    tags: request.tags.map(([key, value]) => [key, String(value)] as const),
  };

  return {
    token: tokenName,
    request: requestView,
    candidates: entries.map((entry) => ({
      label: entry.label,
      slotLabel: slotLabel(entry.slot),
      verdict: verdicts.get(entry) ?? { kind: "rejected", because: "unknown" },
      won: resolvedEntry !== undefined && entry.id === resolvedEntry.id,
    })),
    winner,
    rule,
    ...(error === undefined ? {} : { error }),
    check,
  };
}
