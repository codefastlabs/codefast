import type { Binding } from "#/binding";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { BindingRegistry } from "#/registry";
import { effectiveBindingScope } from "#/resolution/binding-scope";
import { matchesSlot } from "#/resolution/binding-select";
import { verifyConstructorMetadata } from "#/resolution/class-introspector";
import type { Token } from "#/token";
import { tokenName } from "#/token";
import type { BindingKind, BindingScope, Constructor, ResolveOptions } from "#/types";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  readonly includeParent?: boolean;
}

/** What every dependency declaration shares — constructor params and resolved-factory deps alike. */
interface DependencyRef {
  readonly token: Token<unknown> | Constructor;
  readonly optional: boolean;
  readonly multi: boolean;
  readonly name?: string | undefined;
  readonly tags?: ReadonlyArray<readonly [string, unknown]> | undefined;
}

// ── Builder ───────────────────────────────────────────────────────────────────

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

function slotCriterion(ref: DependencyRef): ResolveOptions | undefined {
  if (ref.name === undefined && (ref.tags === undefined || ref.tags.length === 0)) {
    return undefined;
  }

  return {
    ...(ref.name !== undefined ? { name: ref.name } : {}),
    ...(ref.tags !== undefined && ref.tags.length > 0 ? { tags: ref.tags } : {}),
  };
}

// Mirrors filterBindings' slot semantics (SPEC §6.9); predicates need a live resolution
// context, so the graph keeps every predicate-carrying candidate.
function matchingTargets(candidates: ReadonlyArray<Binding>, ref: DependencyRef): ReadonlyArray<Binding> {
  const criterion = slotCriterion(ref);

  if (ref.multi && criterion === undefined) {
    return candidates;
  }

  return candidates.filter((candidate) => matchesSlot(candidate.slot, criterion));
}

function edgeLabel(ref: DependencyRef, index: number): string {
  const criterion =
    ref.name !== undefined
      ? `name:${ref.name}`
      : ref.tags !== undefined && ref.tags.length > 0
        ? `tag:${ref.tags[0]?.[0]}=${String(ref.tags[0]?.[1])}`
        : `[${index}]`;

  return ref.optional ? `${criterion} optional` : criterion;
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
  const nodes: Array<GraphNode> = [];
  const edges: Array<GraphEdge> = [];
  const includesParent = options?.includeParent === true;
  // One placeholder node per optional-but-unbound token keeps the declared edge visible.
  const unboundNodeIds = new Map<string, string>();

  const addDependencyEdges = (
    from: string,
    ref: DependencyRef,
    index: number,
    lookup: (token: Token<unknown> | Constructor) => ReadonlyArray<Binding>,
  ): void => {
    const targets = matchingTargets(lookup(ref.token), ref);
    const label = edgeLabel(ref, index);

    if (targets.length === 0) {
      // A required-but-unbound dependency is validate()'s story, not the graph's.
      if (!ref.optional) {
        return;
      }

      const name = tokenName(ref.token);
      const key = tokenKeyOf(ref.token);
      let id = unboundNodeIds.get(key);

      if (id === undefined) {
        id = `unbound:${key}`;
        unboundNodeIds.set(key, id);
        nodes.push({ id, tokenName: name, tokenKey: key, kind: "unbound", scope: "unbound", fromParent: false });
      }

      edges.push({
        from,
        to: id,
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

      edges.push({
        from,
        to: target.id,
        label: perTargetLabel,
        optional: ref.optional,
        ...(slotName !== undefined ? { slotName } : {}),
      });
    }
  };

  const addBindings = (
    sourceRegistry: BindingRegistry,
    fromParent: boolean,
    fallbackRegistry?: BindingRegistry,
  ): void => {
    // Own bindings shadow the fallback; the parent chain is consulted only when the token has
    // no local binding, mirroring resolution's upward walk.
    const lookup = (token: Token<unknown> | Constructor): ReadonlyArray<Binding> => {
      const own = sourceRegistry.getAll(token);

      if (own.length > 0 || fallbackRegistry === undefined) {
        return own;
      }

      return fallbackRegistry.getAll(token);
    };

    for (const binding of sourceRegistry.allBindings()) {
      const scope = effectiveBindingScope(binding);
      nodes.push({
        id: binding.id,
        tokenName: tokenName(binding.token),
        tokenKey: tokenKeyOf(binding.token),
        kind: binding.kind,
        scope,
        fromParent,
      });

      if (binding.kind === "class") {
        const meta = verifyConstructorMetadata(metadataReader, binding.target);

        if (meta !== undefined) {
          for (const [index, param] of meta.params.entries()) {
            addDependencyEdges(binding.id, param, index, lookup);
          }
        }
      } else if (binding.kind === "resolved" || binding.kind === "resolved-async") {
        for (const [index, dependency] of binding.deps.entries()) {
          addDependencyEdges(binding.id, dependency, index, lookup);
        }
      } else if (binding.kind === "alias") {
        const aliasRef: DependencyRef = { token: binding.target, optional: false, multi: false };

        for (const target of matchingTargets(lookup(binding.target), aliasRef)) {
          edges.push({ from: binding.id, to: target.id, label: "alias", optional: false });
        }
      }
    }
  };

  addBindings(registry, false, includesParent ? parentRegistry : undefined);
  if (includesParent && parentRegistry !== undefined) {
    addBindings(parentRegistry, true);
  }

  return { nodes, edges, includesParent };
}
