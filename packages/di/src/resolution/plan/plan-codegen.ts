/**
 * Generates a hot instantiation plan as a function of its own, so its call sites answer for one plan only.
 */
import type { Binding } from "#/core/binding";
import { NO_INSTANCE } from "#/core/binding";
import type { ConstructorInvocation } from "#/core/constructor-type";

/**
 * The number of runs a plan's closure makes before the plan is generated as its own function.
 *
 * @remarks Below it a plan stays a closure, which is all a cold container or a per-request child
 * ever runs; above it a plan pays one compile for call sites nothing else feeds.
 *
 * @since 0.10.0
 */
export const PLAN_CODEGEN_THRESHOLD = 32;

/**
 * The shape of a compiled sync plan: what its closure does, stated as data the generator can read.
 *
 * @remarks Every leaf the compiler could not see through is a `thunk` and stays opaque — generated
 * code calls it exactly as the closure did, so an escape keeps its frames, its dispatch and its errors.
 *
 * @since 0.10.0
 */
export type PlanNode =
  | { readonly kind: "construct"; readonly target: ConstructorInvocation; readonly deps: ReadonlyArray<PlanNode> }
  | {
      readonly kind: "accessors";
      readonly construct: (deps: Array<unknown>) => unknown;
      readonly deps: ReadonlyArray<PlanNode>;
    }
  | {
      readonly kind: "call";
      readonly factory: (...args: Array<unknown>) => unknown;
      readonly settle: (result: unknown) => unknown;
      readonly deps: ReadonlyArray<PlanNode>;
    }
  | { readonly kind: "value"; readonly value: unknown }
  | { readonly kind: "singleton"; readonly binding: Binding; readonly escape: () => unknown }
  | { readonly kind: "thunk"; readonly run: () => unknown };

/**
 * The shape of a compiled async plan.
 *
 * @remarks A node that `awaits` has a dependency that may yield a promise, so it runs as the
 * interpreted async path does: every dependency starts in order, a sync throw becomes that slot's
 * rejection, and the constructor or factory runs on the settled values.
 *
 * @since 0.10.0
 */
export type AsyncPlanNode =
  | {
      readonly kind: "construct";
      readonly target: ConstructorInvocation;
      readonly deps: ReadonlyArray<AsyncPlanNode>;
      readonly awaits: boolean;
    }
  | {
      readonly kind: "call";
      readonly factory: (...args: Array<unknown>) => unknown;
      readonly deps: ReadonlyArray<AsyncPlanNode>;
      readonly awaits: boolean;
    }
  | { readonly kind: "value"; readonly value: unknown }
  | { readonly kind: "singleton"; readonly binding: Binding; readonly escape: () => unknown }
  | { readonly kind: "thunk"; readonly run: () => unknown };

const rejectWith = (error: unknown): Promise<never> => Promise.reject(error);

let codegenAvailable: boolean | undefined;
let generatedCount = 0;

/**
 * Whether this runtime lets the engine compile a function from source.
 *
 * @remarks A Content Security Policy without `unsafe-eval` refuses the `Function` constructor; every
 * plan then stays a closure, which behaves identically.
 *
 * @since 0.10.0
 */
export function isPlanCodegenAvailable(): boolean {
  if (codegenAvailable === undefined) {
    try {
      // The one probe of the constructor this module exists to use; a refusal here disables it for good.
      // oxlint-disable-next-line typescript/no-implied-eval
      codegenAvailable = (new Function("return true") as () => unknown)() === true;
    } catch {
      codegenAvailable = false;
    }
  }
  return codegenAvailable;
}

/**
 * Generates a plan as a function of its own, or `null` when the runtime refuses to compile one.
 *
 * @remarks The source carries a serial so no two plans share a compilation-cache entry: V8 keys
 * type feedback by function literal, and one literal per plan is the whole point.
 *
 * @since 0.10.0
 */
export function generatePlan(node: PlanNode): (() => unknown) | null {
  if (!isPlanCodegenAvailable()) {
    return null;
  }
  const emitter = new PlanEmitter();
  return compileRendered(emitter, emitter.expression(node));
}

/**
 * Generates an async plan as a function of its own, or `null` when the runtime refuses to compile one.
 *
 * @since 0.10.0
 */
export function generateAsyncPlan(node: AsyncPlanNode): (() => unknown) | null {
  if (!isPlanCodegenAvailable()) {
    return null;
  }
  const emitter = new PlanEmitter();
  return compileRendered(emitter, emitter.asyncExpression(node));
}

function compileRendered(emitter: PlanEmitter, expression: string): (() => unknown) | null {
  generatedCount += 1;
  const locals = emitter.locals.length === 0 ? "" : `let ${emitter.locals.join(", ")};`;
  const body = `"use strict";/* plan ${String(generatedCount)} */${emitter.hoisted.join("")}return () => {${locals}return ${expression};};`;
  try {
    // Compiling from source is the mechanism: one function literal per plan is what gives it its own feedback.
    // oxlint-disable-next-line typescript/no-implied-eval
    const factory = new Function(...emitter.names, body) as (...args: Array<unknown>) => () => unknown;
    return factory(...emitter.values);
  } catch {
    return null;
  }
}

/**
 * Renders a plan tree as one expression over parameters that carry every value the plan closes over.
 *
 * @remarks A node that awaits its dependencies renders as an inner function of the same source, so
 * every plan's awaiting nodes have call sites of their own too.
 */
class PlanEmitter {
  readonly names: Array<string> = [];
  readonly values: Array<unknown> = [];
  readonly hoisted: Array<string> = [];
  readonly #localsByFunction: Array<Array<string>> = [[]];
  #hoistedCount = 0;
  readonly #slotByValue = new Map<unknown, string>();

  /** The plan function's own temporaries. */
  get locals(): ReadonlyArray<string> {
    return this.#localsByFunction[0]!;
  }

  expression(node: PlanNode): string {
    switch (node.kind) {
      case "construct":
        return `new ${this.#slot(node.target, "C")}(${this.#list(node.deps)})`;
      case "accessors":
        return `${this.#slot(node.construct, "A")}([${this.#list(node.deps)}])`;
      case "call": {
        // The settle only ever throws, so it runs on the promise branch alone and the plain result returns as is.
        const local = this.#local();
        const call = `${this.#slot(node.factory, "F")}(${this.#list(node.deps)})`;
        return `((${local} = ${call}) instanceof ${this.#slot(Promise, "P")} ? ${this.#slot(node.settle, "S")}(${local}) : ${local})`;
      }
      case "value":
        return this.#slot(node.value, "V");
      case "singleton":
        return this.#singletonRead(node.binding, node.escape);
      case "thunk":
        return `${this.#slot(node.run, "T")}()`;
    }
  }

  asyncExpression(node: AsyncPlanNode): string {
    switch (node.kind) {
      case "construct": {
        const target = this.#slot(node.target, "C");
        return node.awaits
          ? this.#settled(node.deps, (values) => `new ${target}(${values})`)
          : `new ${target}(${this.#asyncList(node.deps)})`;
      }
      case "call": {
        const factory = this.#slot(node.factory, "F");
        return node.awaits
          ? this.#settled(node.deps, (values) => `${factory}(${values})`)
          : `${factory}(${this.#asyncList(node.deps)})`;
      }
      case "value":
        return this.#slot(node.value, "V");
      case "singleton":
        return this.#singletonRead(node.binding, node.escape);
      case "thunk":
        return `${this.#slot(node.run, "T")}()`;
    }
  }

  #list(deps: ReadonlyArray<PlanNode>): string {
    return deps.map((dep) => this.expression(dep)).join(", ");
  }

  #asyncList(deps: ReadonlyArray<AsyncPlanNode>): string {
    return deps.map((dep) => this.asyncExpression(dep)).join(", ");
  }

  // Every dependency starts in order, a sync throw becomes that slot's rejection so its siblings still
  // start, and the node applies to the settled values — the interpreted async path, rendered.
  #settled(deps: ReadonlyArray<AsyncPlanNode>, apply: (values: string) => string): string {
    const index = this.#hoistedCount;
    this.#hoistedCount += 1;
    const name = `n${String(index)}`;
    const applyName = `a${String(index)}`;
    const reject = this.#slot(rejectWith, "R");
    const promise = this.#slot(Promise, "P");
    this.#localsByFunction.push([]);
    const pendings: Array<string> = [];
    const statements: Array<string> = [];
    for (let position = 0; position < deps.length; position += 1) {
      const pending = `p${String(position)}`;
      pendings.push(pending);
      statements.push(`try{${pending}=${this.asyncExpression(deps[position]!)};}catch(e){${pending}=${reject}(e);}`);
    }
    const locals = [...pendings, ...this.#localsByFunction.pop()!];
    const values = deps.map((_dep, position) => `v[${String(position)}]`).join(",");
    this.hoisted.push(
      `const ${applyName}=(v)=>${apply(values)};const ${name}=()=>{let ${locals.join(",")};${statements.join("")}return ${promise}.all([${pendings.join(",")}]).then(${applyName});};`,
    );
    return `${name}()`;
  }

  #local(): string {
    const locals = this.#localsByFunction.at(-1)!;
    const local = `t${String(locals.length)}`;
    locals.push(local);
    return local;
  }

  #singletonRead(binding: Binding, escape: () => unknown): string {
    const local = this.#local();
    const slot = this.#slot(binding, "B");
    return `((${local} = ${slot}.instance) === ${this.#slot(NO_INSTANCE, "N")} ? ${this.#slot(escape, "E")}() : ${local})`;
  }

  // One parameter per distinct value, so a class constructed four times is one constructor with four sites.
  #slot(value: unknown, prefix: string): string {
    let name = this.#slotByValue.get(value);
    if (name === undefined) {
      name = `${prefix}${String(this.names.length)}`;
      this.#slotByValue.set(value, name);
      this.names.push(name);
      this.values.push(value);
    }
    return name;
  }
}
