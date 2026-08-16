import type { Binding } from "#/core/binding";
import { effectiveBindingScope } from "#/core/binding-scope";
import type { BindingRegistry } from "#/core/registry";
import type { Token } from "#/core/token";
import { tokenName } from "#/core/token";
import type { BindingKind, BindingScope, Constructor } from "#/core/types";
import type { DependencySlot } from "#/injection/resolve-options";
import { bindingSlotToResolveOptions } from "#/injection/resolve-options";
import type { MetadataReader } from "#/metadata/metadata-types";
import { matchesSlot } from "#/resolution/select/binding-select";

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 *
 * @remarks `kind`/`scope` are `"unbound"` for the placeholder node an optional, currently
 * unsatisfied dependency points at.
 */
export interface GraphNode {
  readonly id: string;
  readonly tokenName: string;
  /** Identifies the token itself, so bindings that share a display name stay distinguishable. */
  readonly tokenKey: string;
  readonly kind: BindingKind | "unbound";
  readonly scope: BindingScope | "unbound";
  readonly fromParent: boolean;
}

/**
 * @since 0.3.16-canary.0
 *
 * @remarks `label` is presentation, assembled for the adapters; read `optional` and `slotName`
 * rather than parsing it.
 */
export interface GraphEdge {
  readonly from: string;
  readonly to: string;
  readonly label?: string;
  readonly optional: boolean;
  /** The named slot this edge resolves to, when the binding declares one. */
  readonly slotName?: string;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ContainerGraphJson {
  readonly nodes: ReadonlyArray<GraphNode>;
  readonly edges: ReadonlyArray<GraphEdge>;
  readonly includesParent: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
export interface GraphOptions {
  readonly includeParent?: boolean | undefined;
}

// ── Builder ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Tokens are compared by object identity, and a name is free to repeat, so the graph mints its
// own per-process key. Weakly held: a discarded token takes its key with it.
const tokenKeys = new WeakMap<object, string>();
let tokenKeySequence = 0;

function tokenKeyOf(dependency: Token<unknown> | Constructor): string {
  const existing = tokenKeys.get(dependency);

  if (existing !== undefined) {
    return existing;
  }

  tokenKeySequence += 1;
  const key = `${tokenName(dependency)}@${String(tokenKeySequence)}`;

  tokenKeys.set(dependency, key);

  return key;
}

// Mirrors filterBindings' slot semantics; predicates need a live resolution context, so the graph
// keeps every predicate-carrying candidate.
function matchingTargets(candidates: ReadonlyArray<Binding>, ref: DependencySlot): ReadonlyArray<Binding> {
  const criterion = bindingSlotToResolveOptions(ref);

  if (ref.multi && criterion === undefined) {
    return candidates;
  }

  return candidates.filter((candidate) => matchesSlot(candidate.slot, criterion));
}

function edgeLabel(ref: DependencySlot, index: number): string {
  const criterion =
    ref.name !== undefined
      ? `name:${ref.name}`
      : ref.tags !== undefined && ref.tags.length > 0
        ? `tag:${ref.tags[0]?.key.name}=${String(ref.tags[0]?.value)}`
        : `[${index}]`;

  return ref.optional ? `${criterion} optional` : criterion;
}

/** The collections a graph walk fills, so each step of the walk can be a function of its own. */
interface GraphAccumulator {
  readonly nodes: Array<GraphNode>;
  readonly edges: Array<GraphEdge>;
  // One placeholder node per optional-but-unbound token keeps the declared edge visible.
  readonly unboundNodeIds: Map<string, string>;
}

/** Own bindings shadow the fallback, mirroring resolution's upward walk. */
type BindingLookup = (token: Token<unknown> | Constructor) => ReadonlyArray<Binding>;

function bindingLookup(sourceRegistry: BindingRegistry, fallbackRegistry: BindingRegistry | undefined): BindingLookup {
  return (token) => {
    const own = sourceRegistry.getAll(token);

    if (own.length > 0 || fallbackRegistry === undefined) {
      return own;
    }

    return fallbackRegistry.getAll(token);
  };
}

/** The placeholder node an optional-but-unbound dependency points at, minted once per token. */
function unboundNodeIdFor(accumulator: GraphAccumulator, dependency: Token<unknown> | Constructor): string {
  const key = tokenKeyOf(dependency);
  const existing = accumulator.unboundNodeIds.get(key);

  if (existing !== undefined) {
    return existing;
  }

  const id = `unbound:${key}`;

  accumulator.unboundNodeIds.set(key, id);
  accumulator.nodes.push({
    id,
    tokenName: tokenName(dependency),
    tokenKey: key,
    kind: "unbound",
    scope: "unbound",
    fromParent: false,
  });

  return id;
}

function addDependencyEdges(
  accumulator: GraphAccumulator,
  from: string,
  ref: DependencySlot,
  index: number,
  lookup: BindingLookup,
): void {
  const targets = matchingTargets(lookup(ref.token), ref);
  const label = edgeLabel(ref, index);

  if (targets.length === 0) {
    // A required-but-unbound dependency is validate()'s story, not the graph's.
    if (!ref.optional) {
      return;
    }

    accumulator.edges.push({
      from,
      to: unboundNodeIdFor(accumulator, ref.token),
      label,
      optional: true,
      ...(ref.name !== undefined ? { slotName: ref.name } : {}),
    });

    return;
  }

  for (const target of targets) {
    // A multi dep with no criterion of its own fans out — each edge names the slot it hits.
    const slotName = target.slot.name ?? ref.name;
    const perTargetLabel =
      ref.multi && ref.name === undefined && slotName !== undefined
        ? edgeLabel({ ...ref, name: slotName }, index)
        : label;

    accumulator.edges.push({
      from,
      to: target.id,
      label: perTargetLabel,
      optional: ref.optional,
      ...(slotName !== undefined ? { slotName } : {}),
    });
  }
}

/** What one binding declares up front — a class's params, a factory's descriptors, an alias's target. */
function addBindingEdges(
  accumulator: GraphAccumulator,
  binding: Binding,
  metadataReader: MetadataReader,
  lookup: BindingLookup,
): void {
  if (binding.kind === "class") {
    const meta = metadataReader.getConstructorMetadata(binding.target);

    if (meta !== undefined) {
      for (const [index, param] of meta.params.entries()) {
        addDependencyEdges(accumulator, binding.id, param, index, lookup);
      }
    }

    return;
  }

  if (binding.kind === "resolved" || binding.kind === "resolved-async") {
    for (const [index, dependency] of binding.deps.entries()) {
      addDependencyEdges(accumulator, binding.id, dependency, index, lookup);
    }

    return;
  }

  if (binding.kind === "alias") {
    const aliasRef: DependencySlot = { token: binding.target, optional: false, multi: false };

    for (const target of matchingTargets(lookup(binding.target), aliasRef)) {
      accumulator.edges.push({ from: binding.id, to: target.id, label: "alias", optional: false });
    }
  }
}

function addRegistryBindings(
  accumulator: GraphAccumulator,
  sourceRegistry: BindingRegistry,
  metadataReader: MetadataReader,
  fromParent: boolean,
  fallbackRegistry?: BindingRegistry,
): void {
  const lookup = bindingLookup(sourceRegistry, fallbackRegistry);

  for (const binding of sourceRegistry.allBindings()) {
    accumulator.nodes.push({
      id: binding.id,
      tokenName: tokenName(binding.token),
      tokenKey: tokenKeyOf(binding.token),
      kind: binding.kind,
      scope: effectiveBindingScope(binding),
      fromParent,
    });

    addBindingEdges(accumulator, binding, metadataReader, lookup);
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function buildDependencyGraph(
  registry: BindingRegistry,
  metadataReader: MetadataReader,
  options: GraphOptions | undefined,
  parentRegistry?: BindingRegistry,
): ContainerGraphJson {
  const accumulator: GraphAccumulator = { nodes: [], edges: [], unboundNodeIds: new Map() };
  const includesParent = options?.includeParent === true;

  addRegistryBindings(accumulator, registry, metadataReader, false, includesParent ? parentRegistry : undefined);

  if (includesParent && parentRegistry !== undefined) {
    addRegistryBindings(accumulator, parentRegistry, metadataReader, true);
  }

  return { nodes: accumulator.nodes, edges: accumulator.edges, includesParent };
}
