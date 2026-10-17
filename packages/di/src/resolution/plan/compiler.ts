/**
 * Compiles a transient class or resolved-factory binding into a nested-constructor closure.
 *
 * @remarks A dependency the compiler cannot inline escapes to a resolver callback instead; the
 * closure must stay callable for it, which is what bounds what may be inlined.
 */
import type { Binding } from "#core/binding";
import { NO_INSTANCE } from "#core/binding";
import type { ConstructorInvocation } from "#core/constructor-type";
import type { Token } from "#core/token";
import { tokenName } from "#core/token";
import type { Constructor, ResolutionFrame, ResolveOptions } from "#core/types";
import { AsyncResolutionError } from "#errors";
import type { DependencySlot } from "#injection/dependency-slot";
import { injectionSlotToResolveOptions } from "#injection/dependency-slot";
import type { ConstructorMetadata } from "#metadata/types";
import { enterSeededPath, leaveSeededPath } from "#resolution/path";
import type { PlanNode } from "#resolution/plan/codegen";
import { generatePlan, isPlanCodegenAvailable, PLAN_CODEGEN_THRESHOLD } from "#resolution/plan/codegen";

/**
 * Compilation asked to retry later (class lifecycle metadata not discovered yet).
 *
 * @since 0.5.0-canary.7
 */
export const PLAN_RETRY: unique symbol = Symbol("di:plan-retry");

/**
 * A compiled plan, `null` for "not plannable under the current cache versions",
 * or {@link PLAN_RETRY} when a first runtime resolve must discover metadata first.
 *
 * @since 0.5.0-canary.7
 */
export type InstantiationPlanCompileResult = (() => unknown) | null | typeof PLAN_RETRY;

/** One compiled sync node: the closure that runs it and the shape the code generator renders. */
interface SyncNode {
  readonly run: () => unknown;
  readonly node: PlanNode;
}

/**
 * What compiling one *dependency* can yield.
 *
 * @remarks No `null`: a dependency escapes rather than failing, so "no plan" is only ever a
 * verdict on a plan's root.
 */
type DependencyCompileResult = SyncNode | typeof PLAN_RETRY;

type SyncPlanCompileResult = SyncNode | null | typeof PLAN_RETRY;

/**
 * A plan that runs its closure first and, once it keeps running, swaps in a function generated of its own.
 *
 * @remarks Nothing resolved only a few times ever compiles one; `onGenerated` counts the plans generated.
 */
export function tieredPlan(
  closure: () => unknown,
  generate: () => (() => unknown) | null,
  replace: (current: () => unknown, next: () => unknown) => void,
  onGenerated: () => void,
): () => unknown {
  if (!isPlanCodegenAvailable()) {
    return closure;
  }
  let runs = 0;
  const plan = (): unknown => {
    runs += 1;
    if (runs === PLAN_CODEGEN_THRESHOLD) {
      const generated = generate();
      if (generated !== null) {
        onGenerated();
      }
      replace(plan, generated ?? closure);
    }
    return closure();
  };
  return plan;
}

/**
 * A dependency's terminal binding — all a compiled thunk needs.
 *
 * @since 0.5.0-canary.7
 */
export interface InstantiationPlanDependencyEntry {
  readonly binding: Binding;
}

/**
 * Everything the compiler needs from its resolver, expressed as behavior so the
 * compiler stays independently testable and free of resolver internals.
 *
 * @since 0.5.0-canary.7
 */
export interface InstantiationPlanHost {
  /** Owner-aware: container-level hooks belong to the binding's owner, which may be a parent. */
  hasActivationHandlers(binding: Binding): boolean;
  /** Cached postConstruct presence — `undefined` until a runtime resolve discovers it. */
  knownPostConstruct(target: Constructor): boolean | undefined;
  needsActiveContainer(target: Constructor): boolean;
  /**
   * Constructs a class whose accessors resolve during construction, with the container ambient and
   * the binding's frame on the path so an accessor that cycles back is still caught.
   */
  constructWithAccessors(binding: Binding, target: ConstructorInvocation, deps: Array<unknown>): unknown;
  getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined;
  /** Options-less lookup with alias hops folded; `null` when the fast lane can't answer. */
  lookupDependencyEntry(token: Token<unknown> | Constructor): InstantiationPlanDependencyEntry | null;
  /**
   * A single-criterion lookup a plan may bake in, or `null` when the answer is not the compiler's
   * to make.
   *
   * @remarks Selection for such a request is an index hit *and* a predicate, and a predicate reads
   * the resolution path — so only a candidate carrying none of one can be decided ahead of time.
   */
  lookupPathIndependentEntry(
    token: Token<unknown> | Constructor,
    options: ResolveOptions,
  ): InstantiationPlanDependencyEntry | null;
  /** The frame the interpreted path pushes for this binding, so escapes can replay it. */
  getResolutionFrame(binding: Binding): ResolutionFrame;
  /** Swaps a plan the host still holds for its successor; a plan the host has since dropped stays dropped. */
  replacePlan(binding: Binding, current: () => unknown, next: () => unknown): void;
  /** Runtime resolve for an escaped dependency, seeded with the ancestor frames above it. */
  resolveEscaped(
    token: Token<unknown> | Constructor,
    options: ResolveOptions | undefined,
    arity: EscapeArity,
    resolutionStack: Array<ResolutionFrame>,
  ): unknown;
}

/**
 * Which resolve an escaped dependency replays — mirrors how the interpreted path dispatches
 * a constructor param.
 *
 * @since 0.5.0-canary.8
 */
export type EscapeArity = "all" | "optional" | "single";

/**
 * The compiler that flattens a class or resolved binding's dependencies into an instantiation plan.
 *
 * @since 0.3.16-canary.1
 */
export class InstantiationPlanCompiler {
  readonly #host: InstantiationPlanHost;
  #generatedPlanCount = 0;

  constructor(host: InstantiationPlanHost) {
    this.#host = host;
  }

  /** Plans this compiler has generated as functions of their own. */
  get generatedPlanCount(): number {
    return this.#generatedPlanCount;
  }

  compile(binding: Binding & { kind: "class" | "resolved" }): InstantiationPlanCompileResult {
    const compiled =
      binding.kind === "class"
        ? this.#compileClassPlan(binding, new Set(), 0, [])
        : this.#compileResolvedPlan(binding, new Set(), 0, []);
    if (compiled === null || compiled === PLAN_RETRY) {
      return compiled;
    }
    const host = this.#host;
    return this.#tiered(
      compiled.run,
      () => generatePlan(compiled.node),
      (current, next) => host.replacePlan(binding, current, next),
    );
  }

  #tiered(
    closure: () => unknown,
    generate: () => (() => unknown) | null,
    replace: (current: () => unknown, next: () => unknown) => void,
  ): () => unknown {
    return tieredPlan(closure, generate, replace, () => {
      this.#generatedPlanCount += 1;
    });
  }

  /**
   * Re-entry into the runtime resolver for a dependency the plan can't see through.
   *
   * The ancestors are fixed at compile time, so the seed is built once and lent per call — the
   * root-stack rule one level down: every sync lane pops what it pushes, so the owned array still
   * holds exactly the seed when a call returns. A reentrant call finds it claimed and mints its
   * own copy; a return that did not restore the length hands nothing back, so the next call mints.
   * The plan pushed no frame for the ancestors it inlined, so the seed's bindings are marked in
   * flight around the call: an escaped factory cycling back into one is caught as the interpreted
   * path would catch it.
   */
  #compileEscapeThunk(
    token: Token<unknown> | Constructor,
    ancestors: ReadonlyArray<Binding>,
    arity: EscapeArity = "single",
    options?: ResolveOptions,
  ): SyncNode {
    const host = this.#host;
    const frames = ancestors.map((ancestor) => host.getResolutionFrame(ancestor));
    const depth = frames.length;
    let owned: Array<ResolutionFrame> | undefined = [...frames];
    // A plan root's own opaque dependency has one ancestor, and it is the common escape, so its
    // marking is written out: one flag read and at most two writes, no loop and no call.
    const only = ancestors.length === 1 ? ancestors[0] : undefined;
    const run =
      only === undefined
        ? (): unknown => {
            const stack = owned ?? [...frames];
            owned = undefined;
            const alreadyInFlight = enterSeededPath(ancestors);
            try {
              return host.resolveEscaped(token, options, arity, stack);
            } finally {
              leaveSeededPath(ancestors, alreadyInFlight);
              if (stack.length === depth) {
                owned = stack;
              }
            }
          }
        : (): unknown => {
            const stack = owned ?? [...frames];
            owned = undefined;
            const wasInFlight = only.inFlight;
            if (!wasInFlight) {
              only.inFlight = true;
            }
            try {
              return host.resolveEscaped(token, options, arity, stack);
            } finally {
              if (!wasInFlight) {
                only.inFlight = false;
              }
              if (stack.length === depth) {
                owned = stack;
              }
            }
          };
    return { run, node: { kind: "thunk", run } };
  }

  // A resolved binding declares its deps as explicit descriptors — same rules as
  // class params, with the factory call (and its sync-only check) in place of `new`.
  #compileResolvedPlan(
    binding: Binding & { kind: "resolved" },
    compileStack: Set<Binding["identifier"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
  ): SyncPlanCompileResult {
    if (binding.activationHook !== undefined || this.#host.hasActivationHandlers(binding)) {
      return null;
    }
    const factory = binding.factory;
    const tokenDisplayName = tokenName(binding.token);
    const deps = new Array<SyncNode>(binding.deps.length);
    const depAncestors = [...ancestors, binding];
    compileStack.add(binding.identifier);
    try {
      for (let index = 0; index < binding.deps.length; index += 1) {
        const dep = this.#compileInjectionThunk(binding.deps[index]!, compileStack, depth, depAncestors);
        if (dep === PLAN_RETRY) {
          return dep;
        }
        deps[index] = dep;
      }
    } finally {
      compileStack.delete(binding.identifier);
    }
    const runs = deps.map((dep) => dep.run);
    const settle = (factoryResult: unknown): unknown => {
      if (factoryResult instanceof Promise) {
        throw new AsyncResolutionError(tokenDisplayName);
      }
      return factoryResult;
    };
    return {
      run: () => settle(factory(...runs.map((run) => run()))),
      node: { kind: "call", factory, settle, deps: deps.map((dep) => dep.node) },
    };
  }

  /**
   * One dependency of a plan node — a constructor param or a `toResolved` descriptor.
   *
   * @remarks Anything but a plain required single dependency escapes to the runtime path.
   */
  #compileInjectionThunk(
    descriptor: DependencySlot,
    compileStack: Set<Binding["identifier"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
  ): DependencyCompileResult {
    const token = descriptor.token;
    const options = injectionSlotToResolveOptions(descriptor);
    if (descriptor.multi) {
      return this.#compileEscapeThunk(token, ancestors, "all", options);
    }
    if (descriptor.optional) {
      return this.#compileEscapeThunk(token, ancestors, "optional", options);
    }
    if (options !== undefined) {
      // A criterion the registry can settle without reading a path is a dependency like any other:
      // it escapes only because the host cannot decide it ahead of time.
      const indexed = this.#host.lookupPathIndependentEntry(token, options);
      if (indexed !== null) {
        return this.#compileDepThunk(indexed, compileStack, depth, ancestors, options);
      }
      return this.#compileEscapeThunk(token, ancestors, "single", options);
    }
    const entry = this.#host.lookupDependencyEntry(token);
    if (entry === null) {
      return this.#compileEscapeThunk(token, ancestors);
    }
    return this.#compileDepThunk(entry, compileStack, depth, ancestors);
  }

  #compileClassPlan(
    binding: Binding & { kind: "class" },
    compileStack: Set<Binding["identifier"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
  ): SyncPlanCompileResult {
    if (binding.activationHook !== undefined || this.#host.hasActivationHandlers(binding)) {
      return null;
    }
    const target = binding.target;
    const hasPostConstruct = this.#host.knownPostConstruct(target);
    if (hasPostConstruct === undefined) {
      return PLAN_RETRY;
    }
    if (hasPostConstruct) {
      return null;
    }
    // An accessor-injected class compiles only as the plan's root: its accessors resolve during
    // construction with the class's own frame on the path, and a root has no static ancestors to replay.
    const withAccessors = this.#host.needsActiveContainer(target);
    if (withAccessors && depth !== 0) {
      return null;
    }
    const invokable = target as ConstructorInvocation;
    const meta = this.#host.getConstructorMetadata(target);
    if (meta === undefined) {
      // Metadata-less classes with required params throw on the runtime path — keep them there.
      if (target.length !== 0) {
        return null;
      }
      return this.#classNode(binding, invokable, withAccessors, []);
    }
    const params = meta.params;
    if (params.length === 0) {
      return this.#classNode(binding, invokable, withAccessors, []);
    }
    const deps = new Array<SyncNode>(params.length);
    const depAncestors = [...ancestors, binding];
    compileStack.add(binding.identifier);
    try {
      for (let index = 0; index < params.length; index += 1) {
        const dep = this.#compileInjectionThunk(params[index]!, compileStack, depth, depAncestors);
        if (dep === PLAN_RETRY) {
          return dep;
        }
        deps[index] = dep;
      }
    } finally {
      compileStack.delete(binding.identifier);
    }
    return this.#classNode(binding, invokable, withAccessors, deps);
  }

  // The closure is hand-written per arity up to three so the common shapes spread nothing.
  #classNode(
    binding: Binding,
    invokable: ConstructorInvocation,
    withAccessors: boolean,
    deps: ReadonlyArray<SyncNode>,
  ): SyncNode {
    const nodes = deps.map((dep) => dep.node);
    if (withAccessors) {
      const host = this.#host;
      const construct = (values: Array<unknown>): unknown => host.constructWithAccessors(binding, invokable, values);
      const runs = deps.map((dep) => dep.run);
      return { run: () => construct(runs.map((run) => run())), node: { kind: "accessors", construct, deps: nodes } };
    }
    const node: PlanNode = { kind: "construct", target: invokable, deps: nodes };
    switch (deps.length) {
      case 0:
        return { run: () => new invokable(), node };
      case 1: {
        const dep0 = deps[0]!.run;
        return { run: () => new invokable(dep0()), node };
      }
      case 2: {
        const dep0 = deps[0]!.run;
        const dep1 = deps[1]!.run;
        return { run: () => new invokable(dep0(), dep1()), node };
      }
      case 3: {
        const dep0 = deps[0]!.run;
        const dep1 = deps[1]!.run;
        const dep2 = deps[2]!.run;
        return { run: () => new invokable(dep0(), dep1(), dep2()), node };
      }
      default: {
        const runs = deps.map((dep) => dep.run);
        return { run: () => new invokable(...runs.map((run) => run())), node };
      }
    }
  }

  #compileDepThunk(
    entry: InstantiationPlanDependencyEntry,
    compileStack: Set<Binding["identifier"]>,
    depth: number,
    ancestors: ReadonlyArray<Binding>,
    options?: ResolveOptions,
  ): DependencyCompileResult {
    const { binding } = entry;
    if (binding.kind === "constant" && binding.activationHook === undefined) {
      if (!this.#host.hasActivationHandlers(binding)) {
        const value = binding.value;
        return { run: () => value, node: { kind: "value", value } };
      }
    }
    const scope = binding.scope;
    if (scope === "singleton") {
      // Cached-singleton read; the first materialization escapes so it sees the same ancestors
      // (and therefore the same cycle detection) the interpreted path would have built.
      const escape = this.#compileEscapeThunk(binding.token, ancestors, "single", options).run;
      const singletonBinding = binding;
      return {
        run: () => {
          const cached = singletonBinding.instance;
          return cached === NO_INSTANCE ? escape() : cached;
        },
        node: { kind: "singleton", binding: singletonBinding, escape },
      };
    }
    if (scope === "transient" && binding.kind === "class" && !compileStack.has(binding.identifier)) {
      const inlined = this.#compileClassPlan(binding, compileStack, depth + 1, ancestors);
      if (inlined !== null) {
        return inlined;
      }
    }
    // Anything opaque — a factory, a scoped binding, an activation hook, a class the compiler
    // declined — runs on the runtime path, seeded with this plan's ancestors.
    return this.#compileEscapeThunk(binding.token, ancestors, "single", options);
  }
}
