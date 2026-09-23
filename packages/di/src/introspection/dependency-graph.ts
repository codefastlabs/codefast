import type { Binding } from "#core/binding";
import { stringifyTagValue } from "#core/binding";
import { effectiveBindingScope } from "#core/binding-scope";
import type { BindingRegistry } from "#core/registry";
import { slotName } from "#core/tag";
import type { Token } from "#core/token";
import { tokenName } from "#core/token";
import type { BindingKind, BindingScope, Constructor } from "#core/types";
import type { DependencySlot } from "#injection/resolve-options";
import { bindingSlotToResolveOptions } from "#injection/resolve-options";
import type { MetadataReader } from "#metadata/metadata-types";
import { matchesSlot } from "#resolution/select/binding-select";

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * @remarks `kind`/`scope` are `"unbound"` for the placeholder node an optional, currently
 * unsatisfied dependency points at.
 *
 * @since 0.3.16-canary.0
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
 * @remarks `label` is presentation, assembled for the adapters; read `optional` and `slotName`
 * rather than parsing it.
 *
 * @since 0.3.16-canary.0
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
 * A container's dependency graph as plain JSON — nodes, edges, and whether the parent is included.
 *
 * @since 0.3.16-canary.0
 */
export interface ContainerGraphJson {
  readonly nodes: ReadonlyArray<GraphNode>;
  readonly edges: ReadonlyArray<GraphEdge>;
  readonly includesParent: boolean;
}

/**
 * Options controlling what a dependency graph includes.
 *
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

/** The name a dependency asks for, whichever spelling carries it. */
function refSlotName(ref: DependencySlot): string | undefined {
  if (ref.name !== undefined) {
    return ref.name;
  }
  const reserved = ref.tags?.find((criterion) => criterion.key === slotName);
  return reserved === undefined ? undefined : String(reserved.value);
}

function edgeLabel(ref: DependencySlot, index: number): string {
  const name = refSlotName(ref);
  const firstPlainTag = ref.tags?.find((criterion) => criterion.key !== slotName);
  const criterion =
    name !== undefined
      ? `name:${name}`
      : firstPlainTag !== undefined
        ? `tag:${firstPlainTag.key.name}=${stringifyTagValue(firstPlainTag.value)}`
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

/** A binding's registry followed by the ancestors resolution would walk to, nearest first. */
type RegistryChain = ReadonlyArray<BindingRegistry>;

/**
 * The bindings a dependency reaches, found the way resolution finds them.
 *
 * @remarks A single dependency stops at the nearest registry holding a binding its slot matches, and
 * a collection gathers every registry's matches — `resolve` and `resolveAll` respectively.
 */
function dependencyTargets(chain: RegistryChain, ref: DependencySlot): ReadonlyArray<Binding> {
  if (ref.multi) {
    const gathered: Array<Binding> = [];
    for (const registry of chain) {
      gathered.push(...matchingTargets(registry.getAll(ref.token), ref));
    }
    return gathered;
  }
  for (const registry of chain) {
    const targets = matchingTargets(registry.getAll(ref.token), ref);
    if (targets.length > 0) {
      return targets;
    }
  }
  return [];
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
  chain: RegistryChain,
): void {
  const targets = dependencyTargets(chain, ref);
  const label = edgeLabel(ref, index);

  if (targets.length === 0) {
    // A required-but-unbound dependency is validate()'s story, not the graph's.
    if (!ref.optional) {
      return;
    }

    const unboundSlotName = refSlotName(ref);
    accumulator.edges.push({
      from,
      to: unboundNodeIdFor(accumulator, ref.token),
      label,
      optional: true,
      ...(unboundSlotName !== undefined ? { slotName: unboundSlotName } : {}),
    });

    return;
  }

  const requestedName = refSlotName(ref);
  for (const target of targets) {
    // A multi dep with no criterion of its own fans out — each edge names the slot it hits.
    const edgeSlotName = target.slot.name ?? requestedName;
    const perTargetLabel =
      ref.multi && requestedName === undefined && edgeSlotName !== undefined
        ? edgeLabel({ ...ref, name: edgeSlotName }, index)
        : label;

    accumulator.edges.push({
      from,
      to: String(target.identifier),
      label: perTargetLabel,
      optional: ref.optional,
      ...(edgeSlotName !== undefined ? { slotName: edgeSlotName } : {}),
    });
  }
}

/** What one binding declares up front — a class's params, a factory's descriptors, an alias's target. */
function addBindingEdges(
  accumulator: GraphAccumulator,
  binding: Binding,
  metadataReader: MetadataReader,
  chain: RegistryChain,
): void {
  if (binding.kind === "class") {
    const meta = metadataReader.getConstructorMetadata(binding.target);

    if (meta !== undefined) {
      for (const [index, param] of meta.params.entries()) {
        addDependencyEdges(accumulator, String(binding.identifier), param, index, chain);
      }
    }

    return;
  }

  if (binding.kind === "resolved" || binding.kind === "resolved-async") {
    for (const [index, dependency] of binding.deps.entries()) {
      addDependencyEdges(accumulator, String(binding.identifier), dependency, index, chain);
    }

    return;
  }

  if (binding.kind === "alias") {
    const aliasRef: DependencySlot = { token: binding.target, optional: false, multi: false };

    for (const target of dependencyTargets(chain, aliasRef)) {
      accumulator.edges.push({
        from: String(binding.identifier),
        to: String(target.identifier),
        label: "alias",
        optional: false,
      });
    }
  }
}

/** Adds the nodes of `chain[0]`, the registry the chain starts at, and the edges each of its bindings declares. */
function addRegistryBindings(
  accumulator: GraphAccumulator,
  chain: RegistryChain,
  metadataReader: MetadataReader,
  fromParent: boolean,
): void {
  for (const binding of chain[0]!.allBindings()) {
    accumulator.nodes.push({
      id: String(binding.identifier),
      tokenName: tokenName(binding.token),
      tokenKey: tokenKeyOf(binding.token),
      kind: binding.kind,
      scope: effectiveBindingScope(binding),
      fromParent,
    });

    addBindingEdges(accumulator, binding, metadataReader, chain);
  }
}

/**
 * Builds the JSON dependency graph of a registry's bindings, optionally including its ancestors'.
 *
 * @param registry - The registry whose bindings the graph is for.
 * @param metadataReader - The reader class dependencies are read through.
 * @param options - Whether the ancestors' bindings join the graph.
 * @param ancestorRegistries - The ancestor containers' registries, nearest first.
 *
 * @since 0.3.16-canary.0
 */
export function buildDependencyGraph(
  registry: BindingRegistry,
  metadataReader: MetadataReader,
  options: GraphOptions | undefined,
  ancestorRegistries: ReadonlyArray<BindingRegistry> = [],
): ContainerGraphJson {
  const accumulator: GraphAccumulator = { nodes: [], edges: [], unboundNodeIds: new Map() };
  const includesParent = options?.includeParent === true;

  if (!includesParent) {
    addRegistryBindings(accumulator, [registry], metadataReader, false);
    return { nodes: accumulator.nodes, edges: accumulator.edges, includesParent };
  }

  const chain = [registry, ...ancestorRegistries];
  for (let depth = 0; depth < chain.length; depth += 1) {
    addRegistryBindings(accumulator, chain.slice(depth), metadataReader, depth > 0);
  }

  return { nodes: accumulator.nodes, edges: accumulator.edges, includesParent };
}
