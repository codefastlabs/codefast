/**
 * Random binding graphs, the lanes that resolve them, and the snapshot every lane must agree on.
 *
 * A graph spec is data: nodes bound in order, each on a token index, with a kind, a scope, a slot and
 * dependencies on tokens. The same spec is built into fresh containers and resolved through every
 * entry point the engine has — interpreted, compiled closure, generated plan, collection, optional,
 * a per-request child, and the async lanes. A resolve's outcome is reduced to a structural snapshot
 * (values, sharing pattern, or the error class and message) so the lanes can be compared verbatim.
 */
import * as fc from "fast-check";

import type { Container } from "#container/container";
import { Container as ContainerStatic } from "#container/container";
import type { SlotConstrainedBuilder } from "#core/binding";
import type { BindingTag, TagKey } from "#core/tag";
import { tag } from "#core/tag";
import type { Token } from "#core/token";
import { token } from "#core/token";
import type { BindingScope, Constructor, ResolutionContext } from "#core/types";
import type { InjectableDependency } from "#injection/descriptor";
import { injectAll, optional } from "#injection/descriptor";
import type { ConstructorMetadata, MetadataReader, ParamMetadata } from "#metadata/metadata-types";
import { PLAN_CODEGEN_THRESHOLD } from "#resolution/plan/plan-codegen";
import { whenParentIs } from "#resolution/select/constraints";

// ── Spec ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

type NodeKind = "constant" | "class" | "dynamic" | "dynamic-async" | "resolved" | "resolved-async" | "alias";

type DepMode = "single" | "optional" | "multi";

interface DepSpec {
  /** The token the dependency asks for; one past the last bound token is a token nothing binds. */
  readonly target: number;
  readonly mode: DepMode;
  /** Tag key indexes the request carries; the value is always the key's index, so criteria are shared. */
  readonly tags: ReadonlyArray<number>;
}

interface NodeSpec {
  readonly token: number;
  readonly kind: NodeKind;
  readonly scope: BindingScope;
  readonly deps: ReadonlyArray<DepSpec>;
  /** Tag key indexes the slot declares — empty for the default slot. */
  readonly slotTags: ReadonlyArray<number>;
  /** A collection member; only ever true on the default slot. */
  readonly many: boolean;
  /** `when(whenParentIs(tokens[parentIs]))`, or none. */
  readonly parentIs: number | undefined;
  /** An identity `onActivation` hook on the binding, which declines the plan compiler. */
  readonly hook: boolean;
  /** For an alias: the token it points at. */
  readonly aliasTarget: number;
}

export interface GraphSpec {
  readonly tokenCount: number;
  readonly nodes: ReadonlyArray<NodeSpec>;
}

const KINDS: ReadonlyArray<NodeKind> = [
  "class",
  "class",
  "class",
  "resolved",
  "resolved",
  "dynamic",
  "constant",
  "alias",
  "dynamic-async",
  "resolved-async",
];

const SCOPES: ReadonlyArray<BindingScope> = ["transient", "transient", "singleton", "scoped"];

const TAG_KEY_COUNT = 3;

function depArb(tokenCount: number): fc.Arbitrary<DepSpec> {
  return fc.record({
    // One past the bound range is a token nothing binds.
    target: fc.integer({ min: 0, max: tokenCount }),
    mode: fc.constantFrom<DepMode>("single", "single", "single", "optional", "multi"),
    tags: fc.uniqueArray(fc.integer({ min: 0, max: TAG_KEY_COUNT - 1 }), { maxLength: 2, size: "max" }),
  });
}

function nodeArb(tokenCount: number): fc.Arbitrary<NodeSpec> {
  return fc
    .record({
      token: fc.integer({ min: 0, max: tokenCount - 1 }),
      kind: fc.constantFrom(...KINDS),
      scope: fc.constantFrom(...SCOPES),
      deps: fc.array(depArb(tokenCount), { maxLength: 3, size: "max" }),
      slotTags: fc.uniqueArray(fc.integer({ min: 0, max: TAG_KEY_COUNT - 1 }), { maxLength: 2, size: "max" }),
      many: fc.boolean(),
      parentIs: fc.option(fc.integer({ min: 0, max: tokenCount - 1 }), { nil: undefined, freq: 3 }),
      hook: fc.boolean(),
      aliasTarget: fc.integer({ min: 0, max: tokenCount - 1 }),
    })
    .map((node) => ({
      ...node,
      // A member keeps the default slot, and only the kinds that carry hooks may declare one.
      many: node.many && node.slotTags.length === 0,
      hook: node.hook && node.kind !== "alias",
    }));
}

/**
 * A random graph: a few tokens, more nodes than tokens so siblings, displacement and members occur.
 */
export const graphSpecArb: fc.Arbitrary<GraphSpec> = fc
  .integer({ min: 1, max: 3 })
  .chain((tokenCount) =>
    fc.record({
      tokenCount: fc.constant(tokenCount),
      nodes: fc.array(nodeArb(tokenCount), { minLength: 1, maxLength: 12, size: "max" }),
    }),
  )
  // Token 0 is the root every lane resolves, so something must bind it.
  .filter((spec) => spec.nodes.some((node) => node.token === 0));

/**
 * A linear chain of classes `depth` deep, optionally closing a cycle from the tail back to a level.
 *
 * @remarks Deep enough that a compiled plan renders dozens of levels and the interpreted lanes push as
 * many frames, so a depth-dependent divergence on any lane has room to appear.
 */
export const chainSpecArb: fc.Arbitrary<GraphSpec> = fc
  .record({
    depth: fc.integer({ min: 1, max: 80 }),
    tailKind: fc.constantFrom<NodeKind>("class", "dynamic", "resolved", "constant"),
    cycleBack: fc.option(fc.integer({ min: 0, max: 79 }), { nil: undefined, freq: 2 }),
    hookAt: fc.option(fc.integer({ min: 0, max: 79 }), { nil: undefined, freq: 3 }),
  })
  .map(({ depth, tailKind, cycleBack, hookAt }) => {
    const nodes: Array<NodeSpec> = [];
    for (let level = 0; level < depth; level += 1) {
      const isTail = level === depth - 1;
      const deps: Array<DepSpec> = [];
      if (!isTail) {
        deps.push({ target: level + 1, mode: "single", tags: [] });
      } else if (cycleBack !== undefined) {
        // Uniform over the levels, the tail included, so a self-cycle is as likely as any other.
        deps.push({ target: cycleBack % depth, mode: "single", tags: [] });
      }
      nodes.push({
        token: level,
        kind: isTail ? tailKind : "class",
        scope: "transient",
        deps: isTail && tailKind === "constant" ? [] : deps,
        slotTags: [],
        many: false,
        parentIs: undefined,
        hook: hookAt === level,
        aliasTarget: 0,
      });
    }
    return { tokenCount: depth, nodes };
  });

/**
 * A root with several sibling dependencies on distinct tokens, each token holding a default binding
 * and perhaps one narrowed by `whenParentIs` to the root or to a sibling's token.
 *
 * @remarks The async lane starts siblings concurrently on one branch, so this is the shape on which
 * a selection that reads the path can see a sibling's frame where the sync lane sees the root's.
 */
export const siblingSpecArb: fc.Arbitrary<GraphSpec> = fc
  .record({
    depCount: fc.integer({ min: 2, max: 4 }),
    rootKind: fc.constantFrom<NodeKind>("class", "resolved", "dynamic"),
    siblingKinds: fc.array(fc.constantFrom<NodeKind>("class", "dynamic", "resolved", "constant"), {
      minLength: 4,
      maxLength: 4,
    }),
    narrowedTo: fc.array(fc.option(fc.integer({ min: 0, max: 4 }), { nil: undefined }), { minLength: 4, maxLength: 4 }),
    modes: fc.array(fc.constantFrom<DepMode>("single", "single", "optional", "multi"), { minLength: 4, maxLength: 4 }),
  })
  .map(({ depCount, rootKind, siblingKinds, narrowedTo, modes }) => {
    const nodes: Array<NodeSpec> = [];
    const plain = (tokenIndex: number, kind: NodeKind, parentIs: number | undefined): NodeSpec => ({
      token: tokenIndex,
      kind,
      scope: kind === "constant" ? "singleton" : "transient",
      deps: [],
      slotTags: [],
      many: false,
      parentIs,
      hook: false,
      aliasTarget: 0,
    });
    for (let index = 0; index < depCount; index += 1) {
      const tokenIndex = index + 1;
      nodes.push(plain(tokenIndex, siblingKinds[index]!, undefined));
      const narrowed = narrowedTo[index];
      if (narrowed !== undefined && narrowed <= depCount) {
        nodes.push(plain(tokenIndex, "constant", narrowed));
      }
    }
    nodes.push({
      token: 0,
      kind: rootKind,
      scope: "transient",
      deps: Array.from({ length: depCount }, (_value, index) => ({
        target: index + 1,
        mode: modes[index]!,
        tags: [],
      })),
      slotTags: [],
      many: false,
      parentIs: undefined,
      hook: false,
      aliasTarget: 0,
    });
    return { tokenCount: depCount + 1, nodes };
  });

// ── Building ─────────────────────────────────────────────────────────────────────────────────────────────────────────

interface GraphMaterials {
  readonly tokens: ReadonlyArray<Token<unknown>>;
  readonly tagKeys: ReadonlyArray<TagKey<number>>;
  readonly reader: MetadataReader;
  readonly classes: ReadonlyArray<Constructor | undefined>;
  readonly constants: ReadonlyArray<object | undefined>;
}

/** A class the spec builder mints for one node; its instance records the arguments it was handed. */
interface BuiltInstance {
  readonly args: ReadonlyArray<unknown>;
}

/** The tokens and tag keys a spec is built over; everything else in the materials derives from them. */
type GraphKeys = Pick<GraphMaterials, "tokens" | "tagKeys">;

function criterion(keys: GraphKeys, index: number): BindingTag {
  return keys.tagKeys[index]!.of(index);
}

function paramOf(keys: GraphKeys, dep: DepSpec, index: number): ParamMetadata {
  const base = {
    index,
    token: keys.tokens[dep.target]!,
    optional: dep.mode === "optional",
    multi: dep.mode === "multi",
  };
  return dep.tags.length === 0 ? base : { ...base, tags: dep.tags.map((tagIndex) => criterion(keys, tagIndex)) };
}

function descriptorOf(materials: GraphMaterials, dep: DepSpec): InjectableDependency {
  const target = materials.tokens[dep.target]!;
  const options =
    dep.tags.length === 0 ? undefined : { tags: dep.tags.map((tagIndex) => criterion(materials, tagIndex)) };
  if (dep.mode === "optional") {
    return optional(target, options);
  }
  if (dep.mode === "multi") {
    return injectAll(target, options);
  }
  return options === undefined ? target : { token: target, optional: false, multi: false, tags: options.tags };
}

function resolveThroughContext(ctx: ResolutionContext, materials: GraphMaterials, dep: DepSpec): unknown {
  const target = materials.tokens[dep.target]!;
  const options =
    dep.tags.length === 0 ? undefined : { tags: dep.tags.map((tagIndex) => criterion(materials, tagIndex)) };
  if (dep.mode === "optional") {
    return ctx.resolveOptional(target, options);
  }
  if (dep.mode === "multi") {
    return ctx.resolveAll(target, options);
  }
  return ctx.resolve(target, options);
}

function resolveThroughContextAsync(ctx: ResolutionContext, materials: GraphMaterials, dep: DepSpec): Promise<unknown> {
  const target = materials.tokens[dep.target]!;
  const options =
    dep.tags.length === 0 ? undefined : { tags: dep.tags.map((tagIndex) => criterion(materials, tagIndex)) };
  if (dep.mode === "optional") {
    return ctx.resolveOptionalAsync(target, options);
  }
  if (dep.mode === "multi") {
    return ctx.resolveAllAsync(target, options);
  }
  return ctx.resolveAsync(target, options);
}

/**
 * Mints the tokens, tag keys, classes, constants and the metadata reader one spec shares across
 * every container it is built into.
 *
 * @remarks Shared on purpose: a constant is the same object in every lane, so the snapshot's
 * sharing pattern is comparable, and a class's metadata is read through one reader everywhere.
 */
export function prepareGraph(spec: GraphSpec): GraphMaterials {
  const tokens = Array.from({ length: spec.tokenCount + 1 }, (_value, index) => token<unknown>(`t${String(index)}`));
  const tagKeys = Array.from({ length: TAG_KEY_COUNT }, (_value, index) => tag<number>(`diff:k${String(index)}`));
  const metadata = new Map<Constructor, ConstructorMetadata>();
  const keys: GraphKeys = { tokens, tagKeys };
  const classes = spec.nodes.map((node, nodeIndex) => {
    if (node.kind !== "class") {
      return undefined;
    }
    const built = class implements BuiltInstance {
      readonly args: ReadonlyArray<unknown>;
      constructor(...args: Array<unknown>) {
        this.args = args;
      }
    };
    Object.defineProperty(built, "name", { value: `N${String(nodeIndex)}` });
    metadata.set(built, { params: node.deps.map((dep, index) => paramOf(keys, dep, index)) });
    return built as Constructor;
  });
  const constants = spec.nodes.map((node, nodeIndex) =>
    node.kind === "constant" ? { constant: nodeIndex } : undefined,
  );
  const reader: MetadataReader = {
    getConstructorMetadata: (target) => metadata.get(target),
    getLifecycleMetadata: () => undefined,
  };
  return { tokens, tagKeys, reader, classes, constants };
}

/** Binds every node of the spec into `container`, in order. */
function bindGraph(container: Container, spec: GraphSpec, materials: GraphMaterials): void {
  spec.nodes.forEach((node, nodeIndex) => {
    const bindTarget = materials.tokens[node.token]!;
    const chain = container.bind(bindTarget);
    const constrain = (builder: SlotConstrainedBuilder): void => {
      for (const tagIndex of node.slotTags) {
        builder.whenTagged(criterion(materials, tagIndex));
      }
      if (node.many) {
        builder.many();
      }
      if (node.parentIs !== undefined) {
        builder.when(whenParentIs(materials.tokens[node.parentIs]!));
      }
    };
    if (node.kind === "alias") {
      constrain(chain.toAlias(materials.tokens[node.aliasTarget]!));
      return;
    }
    if (node.kind === "constant") {
      const constant = chain.toConstantValue(materials.constants[nodeIndex]!);
      constrain(constant);
      if (node.hook) {
        constant.onActivation((_ctx, instance) => instance);
      }
      return;
    }
    let scoped;
    switch (node.kind) {
      case "class":
        scoped = chain.to(materials.classes[nodeIndex]!);
        break;
      case "dynamic":
        scoped = chain.toDynamic((ctx) => ({
          dynamic: nodeIndex,
          deps: node.deps.map((dep) => resolveThroughContext(ctx, materials, dep)),
        }));
        break;
      case "dynamic-async":
        scoped = chain.toDynamicAsync(async (ctx) => ({
          dynamic: nodeIndex,
          deps: await Promise.all(node.deps.map((dep) => resolveThroughContextAsync(ctx, materials, dep))),
        }));
        break;
      case "resolved":
        scoped = chain.toResolved(
          (...args: Array<unknown>) => ({ resolved: nodeIndex, args }),
          node.deps.map((dep) => descriptorOf(materials, dep)),
        );
        break;
      case "resolved-async":
        scoped = chain.toResolvedAsync(
          (...args: Array<unknown>) => Promise.resolve({ resolved: nodeIndex, args }),
          node.deps.map((dep) => descriptorOf(materials, dep)),
        );
        break;
    }
    constrain(scoped);
    const withScope =
      node.scope === "singleton" ? scoped.singleton() : node.scope === "scoped" ? scoped.scoped() : scoped.transient();
    if (node.hook) {
      withScope.onActivation((_ctx, instance) => instance);
    }
  });
}

// ── Snapshots ────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Reduces a resolve's outcome to comparable data: values by structure with the sharing pattern
 * numbered in traversal order, errors by class and message.
 */
function snapshotOf(outcome: { readonly value: unknown } | { readonly error: unknown }): unknown {
  if ("error" in outcome) {
    const { error } = outcome;
    if (error instanceof Error) {
      // Binding ids are minted process-wide, so a message listing candidates is compared by shape.
      return { error: error.constructor.name, message: error.message.replace(/\[\d+(?:, \d+)*\]/g, "[ids]") };
    }
    return { error: "non-error", thrown: String(error) };
  }
  const seen = new Map<object, number>();
  const walk = (value: unknown): unknown => {
    if (typeof value !== "object" || value === null) {
      return value;
    }
    const known = seen.get(value);
    if (known !== undefined) {
      return { ref: known };
    }
    seen.set(value, seen.size);
    if (Array.isArray(value)) {
      return value.map((entry: unknown) => walk(entry));
    }
    const record = value as Record<string, unknown>;
    if ("args" in record && value.constructor !== Object) {
      return { cls: value.constructor.name, args: walk(record["args"]) };
    }
    return Object.fromEntries(Object.entries(record).map(([key, entry]) => [key, walk(entry)]));
  };
  return walk(outcome.value);
}

function attempt(run: () => unknown): unknown {
  try {
    return snapshotOf({ value: run() });
  } catch (error) {
    return snapshotOf({ error });
  }
}

async function attemptAsync(run: () => Promise<unknown>): Promise<unknown> {
  try {
    return snapshotOf({ value: await run() });
  } catch (error) {
    return snapshotOf({ error });
  }
}

// ── Lanes ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * How many times the tiered lane resolves: past the interpreted first resolve, through the closure
 * tier, and into the generated tier, with room to spare.
 */
const TIERED_RESOLVE_COUNT = PLAN_CODEGEN_THRESHOLD + 8;

/** One host's resolve entry points, each reduced to a snapshot, keyed by lane name. */
export type LaneSnapshots = ReadonlyMap<string, unknown>;

/**
 * Resolves the root through every synchronous entry point of one container.
 *
 * @remarks `resolve(root, {})` never takes a plan — only an options-less resolve does — so it is
 * the interpreted reference. The repeated options-less resolves cross every tier in order.
 */
export function syncLanes(container: Container, root: Token<unknown>): LaneSnapshots {
  const lanes = new Map<string, unknown>();
  for (let index = 0; index < TIERED_RESOLVE_COUNT; index += 1) {
    lanes.set(
      `tiered#${String(index)}`,
      attempt(() => container.resolve(root)),
    );
  }
  lanes.set(
    "interpreted",
    attempt(() => container.resolve(root, {})),
  );
  lanes.set(
    "optional",
    attempt(() => container.resolveOptional(root)),
  );
  lanes.set(
    "collection",
    attempt(() => unwrapLoneMember(container.resolveAll(root))),
  );
  lanes.set(
    "collection-again",
    attempt(() => unwrapLoneMember(container.resolveAll(root))),
  );
  return lanes;
}

/** Resolves the root through every asynchronous entry point of one container. */
export async function asyncLanes(container: Container, root: Token<unknown>): Promise<LaneSnapshots> {
  const lanes = new Map<string, unknown>();
  for (let index = 0; index < TIERED_RESOLVE_COUNT; index += 1) {
    lanes.set(`async#${String(index)}`, await attemptAsync(() => container.resolveAsync(root)));
  }
  lanes.set("async-interpreted", await attemptAsync(() => container.resolveAsync(root, {})));
  lanes.set("async-optional", await attemptAsync(() => container.resolveOptionalAsync(root)));
  lanes.set(
    "async-collection",
    await attemptAsync(async () => unwrapLoneMember(await container.resolveAllAsync(root))),
  );
  return lanes;
}

/**
 * A collection read stands in for a single resolve only when the token has one selectable binding.
 *
 * @remarks A single `resolve` never selects a member and a collection read takes every binding, so
 * the two agree only for that shape; any other collection is reported as itself, under a marker that
 * cannot collide with a single resolve's snapshot.
 */
function unwrapLoneMember(values: ReadonlyArray<unknown>): unknown {
  return values.length === 1 ? values[0] : { collectionOf: values.length };
}

// ── Hosts ────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** A fresh root container holding the graph. */
export function rootHost(spec: GraphSpec, materials: GraphMaterials): Container {
  const container = ContainerStatic.create({ metadataReader: materials.reader });
  bindGraph(container, spec, materials);
  return container;
}

/** A fresh child whose parent holds the graph — the per-request shape. */
export function childHost(spec: GraphSpec, materials: GraphMaterials): Container {
  const parent = ContainerStatic.create({ metadataReader: materials.reader });
  bindGraph(parent, spec, materials);
  return parent.createChild();
}

// ── Predicates over specs ────────────────────────────────────────────────────────────────────────────────────────────

/** Whether any node can only be materialised asynchronously. */
export function hasAsyncKind(spec: GraphSpec): boolean {
  return spec.nodes.some((node) => node.kind === "dynamic-async" || node.kind === "resolved-async");
}

/** Whether any node is scoped, which a root container cannot hold an instance of. */
export function hasScopedNode(spec: GraphSpec): boolean {
  return spec.nodes.some((node) => node.scope === "scoped" && node.kind !== "constant" && node.kind !== "alias");
}

/**
 * Whether a collection read of the root stands in for a single resolve: exactly one binding on the
 * root token, on the default slot and not a member — a single `resolve` selects the default slot and
 * never a member, while an options-less collection read takes every binding whatever its slot.
 */
export function isLoneRootBinding(spec: GraphSpec): boolean {
  const onRoot = spec.nodes.filter((node) => node.token === 0);
  return onRoot.length === 1 && !onRoot[0]!.many && onRoot[0]!.slotTags.length === 0;
}

/**
 * Whether a snapshot is the miss a root-level optional read answers with `undefined` instead.
 *
 * @remarks Necessary, not sufficient: the same error thrown from deeper in the graph propagates
 * through an optional read too, so a lane answering `undefined` for any other error is a defect.
 */
export function isRootLevelMiss(snapshot: unknown): boolean {
  if (typeof snapshot !== "object" || snapshot === null || !("error" in snapshot)) {
    return false;
  }
  const { error, message } = snapshot as { error: string; message: string };
  return (error === "TokenNotBoundError" || error === "NoMatchingBindingError") && message.includes("'t0'");
}
