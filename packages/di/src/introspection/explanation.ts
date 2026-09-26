/**
 * Why a request selects the binding it does, read along the path `resolve` takes and decided by the same rules.
 */
import type { Binding } from "#core/binding";
import { bindingSlotToString } from "#core/binding";
import type { BindingRegistry } from "#core/registry";
import type { Token } from "#core/token";
import { tokenName } from "#core/token";
import type { ConstraintContext, Constructor, ResolutionFrame, ResolveOptions } from "#core/types";
import {
  AmbiguousBindingError,
  CircularDependencyError,
  InternalError,
  NoMatchingBindingError,
  TokenNotBoundError,
} from "#errors/errors";
import type { BindingSnapshot } from "#introspection/inspector";
import { snapshotOf } from "#introspection/inspector";
import { DefaultConstraintContext } from "#resolution/context";
import { buildResolutionFrame } from "#resolution/path/resolution-path";
import type { CandidateRule } from "#resolution/select/binding-select";
import { candidateRuleOf, chooseCandidate, matchesSlot } from "#resolution/select/binding-select";

// ── Public types ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A request to explain: the criteria a `resolve` would carry, and the resolutions it is nested in.
 *
 * @typeParam Names - the slot names the token declares, as `ResolveOptions` narrows them
 *
 * @since 0.12.0
 */
export interface ExplainOptions<Names extends string = string> extends ResolveOptions<Names> {
  /**
   * The tokens whose resolution makes this request, outermost first, so a `when()` predicate reads the parent
   * and ancestors it would read inside their factories.
   *
   * @remarks Each is selected as a request with no criteria, nested in the ones before it; one that selects
   * nothing throws what its own `resolve` would.
   */
  readonly ancestors?: ReadonlyArray<Token<unknown> | Constructor> | undefined;
}

/**
 * What selection made of one binding: in the running, or out and why.
 *
 * @remarks `slot-mismatch`: the slot declares a criterion the request does not carry, or the request carries
 * criteria and the slot is the default one. `predicate-refused`: the slot matched and the `when()` predicate
 * returned `false`. `collection-member`: a `many()` binding, which only `resolveAll` takes.
 *
 * @since 0.12.0
 */
export type CandidateVerdict = "eligible" | "slot-mismatch" | "predicate-refused" | "collection-member";

/**
 * The rule that settled one registry's answer.
 *
 * @remarks The four candidate rules of `CandidateRule`, plus `default-alias`: no slot matched, and the token's
 * default-slot alias forwards the request's criteria to its target.
 *
 * @since 0.12.0
 */
export type SelectionRule = CandidateRule | "default-alias";

/**
 * How an explained lookup ended, one outcome for each way `resolve` ends.
 *
 * @remarks `unbound` and `unmatched` are the lookups `resolve` reports as `TokenNotBoundError` and
 * `NoMatchingBindingError`; `ambiguous` and `alias-cycle` are `AmbiguousBindingError` and `CircularDependencyError`.
 *
 * @since 0.12.0
 */
export type ExplanationOutcome = "selected" | "unbound" | "unmatched" | "ambiguous" | "alias-cycle";

/**
 * One binding a registry offered the request, and what selection made of it.
 *
 * @since 0.12.0
 */
export interface CandidateExplanation {
  readonly binding: BindingSnapshot;
  readonly verdict: CandidateVerdict;
}

/**
 * One registry the lookup read, in the order `resolve` reads them.
 *
 * @since 0.12.0
 */
export interface ExplanationStep {
  /** The token looked up here, which an alias hop changes. */
  readonly tokenName: string;
  /** How far up the chain the registry sits: `0` is the container asked, `1` its parent. */
  readonly depth: number;
  /** Every binding this registry holds for the token, in registration order. */
  readonly candidates: ReadonlyArray<CandidateExplanation>;
  /** The rule that settled this registry's answer, or `undefined` when no candidate was eligible. */
  readonly rule: SelectionRule | undefined;
  /** The binding this registry answered with, an alias included, or `undefined` when the lookup moved on. */
  readonly selected: BindingSnapshot | undefined;
}

/**
 * Why one request selects the binding it does, or why it selects none.
 *
 * @since 0.12.0
 */
export interface ResolutionExplanation {
  /** The token the request asks for. */
  readonly tokenName: string;
  /** Every registry that holds a token the lookup asked for, once per alias hop, in the order it read them. */
  readonly steps: ReadonlyArray<ExplanationStep>;
  /** The binding the request resolves to after every alias, or `undefined` when it resolves to none. */
  readonly selected: BindingSnapshot | undefined;
  readonly outcome: ExplanationOutcome;
}

// ── Explanation ──────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Explains a request against a container chain, without instantiating anything.
 *
 * @param registries - the asked container's registry first, then each ancestor's up to the root
 * @param token - the token the request asks for
 * @param options - the request's criteria and the resolutions it is nested in
 * @throws An error `resolve` would throw, when one of `options.ancestors` selects no binding
 *
 * @since 0.12.0
 */
export function explainRequest(
  registries: ReadonlyArray<BindingRegistry>,
  token: Token<unknown> | Constructor,
  options: ExplainOptions | undefined,
): ResolutionExplanation {
  const stack: Array<ResolutionFrame> = [];
  for (const ancestor of options?.ancestors ?? []) {
    const walk = walkLookup(registries, ancestor, undefined, stack);
    if (walk.binding === undefined) {
      throw lookupError(registries, walk);
    }
    stack.push(buildResolutionFrame(walk.binding, tokenName(walk.binding.token)));
  }
  const walk = walkLookup(registries, token, requestOf(options), stack);
  return {
    tokenName: tokenName(token),
    steps: walk.steps,
    selected: walk.binding === undefined ? undefined : snapshotOf(walk.binding),
    outcome: walk.outcome,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** A lookup as it went: the steps it took, the terminal binding, and where it stopped. */
interface Walk {
  readonly steps: Array<ExplanationStep>;
  readonly binding: Binding | undefined;
  readonly outcome: ExplanationOutcome;
  /** The token the lookup stopped on, which an alias hop may have moved from the one asked. */
  readonly lastToken: Token<unknown> | Constructor;
  /** The eligible candidates of an ambiguous step, or the tokens of an alias cycle. */
  readonly ambiguity: ReadonlyArray<Binding> | undefined;
  readonly cycle: ReadonlyArray<Token<unknown> | Constructor> | undefined;
}

// The `ancestors` key is explain's own, and a request carrying no criterion is the request with no options.
function requestOf(options: ExplainOptions | undefined): ResolveOptions | undefined {
  if (
    options === undefined ||
    (options.name === undefined && options.tag === undefined && options.tags === undefined)
  ) {
    return undefined;
  }
  const { ancestors: _ancestors, ...request } = options;
  return request;
}

function walkLookup(
  registries: ReadonlyArray<BindingRegistry>,
  token: Token<unknown> | Constructor,
  request: ResolveOptions | undefined,
  stack: ReadonlyArray<ResolutionFrame>,
): Walk {
  const ctx = new DefaultConstraintContext(stack, request);
  const steps: Array<ExplanationStep> = [];
  let current = token;
  let visited: Set<Token<unknown> | Constructor> | undefined;
  for (;;) {
    const found = findInChain(registries, current, request, ctx, steps);
    if (found.kind === "tie") {
      return {
        steps,
        binding: undefined,
        outcome: "ambiguous",
        lastToken: current,
        ambiguity: found.eligible,
        cycle: undefined,
      };
    }
    if (found.kind === "none") {
      const outcome = registries.some((registry) => registry.getAll(current).length > 0) ? "unmatched" : "unbound";
      return { steps, binding: undefined, outcome, lastToken: current, ambiguity: undefined, cycle: undefined };
    }
    const binding = found.binding;
    if (binding.kind !== "alias") {
      return { steps, binding, outcome: "selected", lastToken: current, ambiguity: undefined, cycle: undefined };
    }
    // An alias hop restarts at the container asked, as `resolve` does, and a revisited token is a cycle.
    const target = binding.target;
    visited ??= new Set([current]);
    if (visited.has(target)) {
      return {
        steps,
        binding: undefined,
        outcome: "alias-cycle",
        lastToken: current,
        ambiguity: undefined,
        cycle: [...visited, target],
      };
    }
    visited.add(target);
    current = target;
  }
}

/** What the chain answers one token with: a binding, a tie between eligible candidates, or nothing. */
type ChainAnswer =
  | { readonly kind: "binding"; readonly binding: Binding }
  | { readonly kind: "tie"; readonly eligible: ReadonlyArray<Binding> }
  | { readonly kind: "none" };

const NO_ANSWER: ChainAnswer = { kind: "none" };

function findInChain(
  registries: ReadonlyArray<BindingRegistry>,
  token: Token<unknown> | Constructor,
  request: ResolveOptions | undefined,
  ctx: ConstraintContext,
  steps: Array<ExplanationStep>,
): ChainAnswer {
  for (let depth = 0; depth < registries.length; depth += 1) {
    const registry = registries[depth]!;
    const bindings = registry.getAll(token);
    if (bindings.length === 0) {
      continue;
    }
    const candidates: Array<CandidateExplanation> = [];
    const eligible: Array<Binding> = [];
    for (const binding of bindings) {
      const verdict = verdictOf(binding, request, ctx);
      candidates.push({ binding: snapshotOf(binding), verdict });
      if (verdict === "eligible") {
        eligible.push(binding);
      }
    }
    const name = tokenName(token);
    if (eligible.length > 0) {
      const selected = chooseCandidate(eligible);
      steps.push({
        tokenName: name,
        depth,
        candidates,
        rule: candidateRuleOf(eligible, selected),
        selected: selected === undefined ? undefined : snapshotOf(selected),
      });
      return selected === undefined ? { kind: "tie", eligible } : { kind: "binding", binding: selected };
    }
    // A request carrying criteria that no slot here matches is forwarded by the token's default-slot alias.
    const defaultSlot = request === undefined ? undefined : registry.getDefaultSlotBinding(token);
    if (defaultSlot !== undefined && defaultSlot.kind === "alias") {
      steps.push({ tokenName: name, depth, candidates, rule: "default-alias", selected: snapshotOf(defaultSlot) });
      return { kind: "binding", binding: defaultSlot };
    }
    steps.push({ tokenName: name, depth, candidates, rule: undefined, selected: undefined });
  }
  return NO_ANSWER;
}

function verdictOf(binding: Binding, request: ResolveOptions | undefined, ctx: ConstraintContext): CandidateVerdict {
  if (binding.isMany) {
    return "collection-member";
  }
  if (!matchesSlot(binding.slot, request)) {
    return "slot-mismatch";
  }
  const predicate = binding.predicate;
  return predicate === undefined || predicate(ctx) ? "eligible" : "predicate-refused";
}

/** The error `resolve` throws for a lookup that ended without a binding. */
function lookupError(registries: ReadonlyArray<BindingRegistry>, walk: Walk): Error {
  const name = tokenName(walk.lastToken);
  switch (walk.outcome) {
    case "ambiguous":
      return new AmbiguousBindingError(
        name,
        (walk.ambiguity ?? []).map((binding) => binding.identifier),
      );
    case "alias-cycle":
      return new CircularDependencyError((walk.cycle ?? []).map((entry) => tokenName(entry)));
    case "unmatched":
      return new NoMatchingBindingError(
        name,
        {},
        registries.flatMap((registry) =>
          registry.getAll(walk.lastToken).map((binding) => bindingSlotToString(binding.slot)),
        ),
      );
    case "unbound":
      return new TokenNotBoundError(name);
    case "selected":
      return new InternalError("a lookup that selected a binding has no error");
  }
}
