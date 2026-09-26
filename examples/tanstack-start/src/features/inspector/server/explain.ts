/** Why the container picked the binding it picked, in the container's own words, checked against the real resolve. */
import type {
  BindingIdentifier,
  BindingSnapshot,
  CandidateVerdict,
  Container,
  ExplanationOutcome,
  ResolveOptions,
  SelectionRule,
  Token,
} from "@codefast/di";
import { DiError } from "@codefast/di";

import type { CatalogEntry } from "#features/inspector/server/catalog";
import type { SlotTags } from "#features/inspector/shared/tenant";

/** The request as it crosses to the client: tag values are rendered, because `unknown` is not serialisable. */
interface RequestView {
  readonly name?: string;
  readonly tags: ReadonlyArray<readonly [string, string]>;
}

/** The request as the container sees it, tag values still their real selves. */
export interface SlotRequest {
  readonly name?: string;
  readonly tags: SlotTags;
}

type CandidateVerdictView =
  | { readonly kind: "eligible"; readonly tagCount: number; readonly guard?: string }
  | { readonly kind: "rejected"; readonly because: string };

export interface CandidateView {
  /** Which binding this is — two bindings can share a label, so identity has to come from the id. */
  readonly id: BindingIdentifier;
  readonly label: string;
  readonly slotLabel: string;
  readonly verdict: CandidateVerdictView;
  readonly won: boolean;
}

export interface Decision {
  readonly token: string;
  /** Set when the slot was resolved as somebody's dependency rather than at the top level. */
  readonly via?: string;
  readonly request: RequestView;
  readonly candidates: ReadonlyArray<CandidateView>;
  readonly winner: string | undefined;
  /** The rule the container applied, or `undefined` when no candidate was eligible anywhere in the chain. */
  readonly rule: SelectionRule | undefined;
  readonly outcome: ExplanationOutcome;
  /** What the container did with this request, when it refused to answer at all. */
  readonly error?: { readonly name: string; readonly message: string };
  /**
   * Whether `explain()` named the binding the real resolve returned; `unreached` when the resolve this slot is nested
   * in failed before it asked for the slot at all.
   */
  readonly check: "agrees" | "disagrees" | "unreached";
}

/**
 * A slot resolved as somebody else's dependency: the parent has already run, so the value is observed from its
 * result, and `ancestors` hands `explain()` the same parent frame the resolve saw.
 */
export interface NestedObservation {
  readonly via: string;
  readonly ancestors: ReadonlyArray<Token<unknown>>;
  readonly observed: unknown;
  readonly error?: { readonly name: string; readonly message: string };
}

const slotLabel = (slot: BindingSnapshot["slot"]): string => {
  const parts = [
    ...(slot.name === undefined ? [] : [`name:${slot.name}`]),
    ...slot.tags.map((criterion) => `${criterion.key.name}:${String(criterion.value)}`),
  ];

  return parts.length === 0 ? "default slot" : `{ ${parts.join(", ")} }`;
};

function optionsOf(request: SlotRequest): ResolveOptions | undefined {
  if (request.name === undefined && request.tags.length === 0) {
    return undefined;
  }

  return request.name === undefined ? { tags: request.tags } : { name: request.name, tags: request.tags };
}

function errorOf(caught: unknown): { readonly name: string; readonly message: string } {
  return {
    name: caught instanceof DiError ? caught.constructor.name : "Error",
    message: caught instanceof Error ? caught.message : String(caught),
  };
}

function verdictView(
  verdict: CandidateVerdict,
  snapshot: BindingSnapshot,
  entry: CatalogEntry | undefined,
): CandidateVerdictView {
  switch (verdict) {
    case "eligible":
      return entry?.guard === undefined
        ? { kind: "eligible", tagCount: snapshot.slot.tags.length }
        : { kind: "eligible", tagCount: snapshot.slot.tags.length, guard: entry.guard };
    case "slot-mismatch":
      return { kind: "rejected", because: "its slot does not match the request" };
    case "predicate-refused":
      return { kind: "rejected", because: `its guard refused: ${entry?.guard ?? "when()"}` };
    case "collection-member":
      return { kind: "rejected", because: "a collection member, which only resolveAll takes" };
  }
}

/**
 * Explains one request with `explain()` and checks the answer against a real resolve. Pass an observation to explain
 * a slot filled inside another resolve.
 */
export function explainSlot(
  container: Container,
  slotToken: Token<unknown>,
  tokenName: string,
  request: SlotRequest,
  entries: ReadonlyArray<CatalogEntry>,
  nested?: NestedObservation,
): Decision {
  const options = optionsOf(request);
  const explanation = container.explain(
    slotToken,
    nested === undefined ? options : { ...options, ancestors: nested.ancestors },
  );

  let resolvedEntry: CatalogEntry | undefined;
  let error: Decision["error"];

  if (nested === undefined) {
    try {
      const resolved = container.resolve(slotToken, options);

      resolvedEntry = entries.find((entry) => entry.value === resolved);
    } catch (caught) {
      error = errorOf(caught);
    }
  } else {
    resolvedEntry = entries.find((entry) => entry.value === nested.observed);
    error = nested.error;
  }

  const entryOf = (id: BindingIdentifier): CatalogEntry | undefined => entries.find((entry) => entry.id === id);
  const selectedId = explanation.selected?.id;
  const deciding = explanation.steps.findLast((step) => step.rule !== undefined);

  return {
    token: tokenName,
    ...(nested === undefined ? {} : { via: nested.via }),
    request: {
      ...(request.name === undefined ? {} : { name: request.name }),
      tags: request.tags.map((criterion) => [criterion.key.name, String(criterion.value)] as const),
    },
    candidates: explanation.steps.flatMap((step) =>
      step.candidates.map(({ binding, verdict }) => {
        const entry = entryOf(binding.id);

        return {
          id: binding.id,
          label: entry?.label ?? binding.tokenName,
          slotLabel: slotLabel(binding.slot),
          verdict: verdictView(verdict, binding, entry),
          won: binding.id === selectedId,
        };
      }),
    ),
    winner: selectedId === undefined ? undefined : entryOf(selectedId)?.label,
    rule: deciding?.rule,
    outcome: explanation.outcome,
    ...(error === undefined ? {} : { error }),
    check: nested?.error !== undefined ? "unreached" : selectedId === resolvedEntry?.id ? "agrees" : "disagrees",
  };
}
