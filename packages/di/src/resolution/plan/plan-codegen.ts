/**
 * Generates a hot instantiation plan as a function of its own, so its call sites answer for one plan only.
 */
import type { Binding } from "#core/binding";
import { NO_INSTANCE } from "#core/binding";
import type { ConstructorInvocation } from "#core/constructor-type";
import { settleInOrder } from "#resolution/async-fan-out";

/**
 * The number of runs a plan's closure makes before the plan is generated as its own function.
 *
 * @remarks Below it a plan stays a closure, which is all a cold container or a per-request child
 * ever runs; above it a plan pays one generation and a cold start — new code, where the closure's
 * is shared and hot — for call sites nothing else feeds, which repays only over runs in the thousands.
 *
 * @since 0.10.0
 */
export const PLAN_CODEGEN_THRESHOLD = 1024;

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
 * rejection, the constructor or factory runs on the settled values, and a failure is reported in
 * declaration order.
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

function compileRendered(emitter: PlanEmitter, result: string): (() => unknown) | null {
  generatedCount += 1;
  const locals = emitter.locals.length === 0 ? "" : `let ${emitter.locals.join(", ")};`;
  const body = `"use strict";/* plan ${String(generatedCount)} */${emitter.hoisted.join("")}return () => {${locals}${emitter.statements.join("")}return ${result};};`;
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
 * Renders a plan tree as a flat sequence of statements over parameters that carry every value the plan closes over.
 *
 * @remarks Each node becomes one assignment to a local after its dependencies' assignments, in declaration
 * order, so the generated function evaluates exactly as the nested closure did while nesting nothing: a
 * graph of any depth renders as that many statements, never as an expression that deep. A node that awaits
 * its dependencies renders as an inner function of the same shape, so every plan's awaiting nodes have call
 * sites of their own too.
 */
class PlanEmitter {
  readonly names: Array<string> = [];
  readonly values: Array<unknown> = [];
  readonly hoisted: Array<string> = [];
  readonly #frames: Array<{ readonly locals: Array<string>; readonly statements: Array<string> }> = [
    { locals: [], statements: [] },
  ];
  #hoistedCount = 0;
  readonly #slotByValue = new Map<unknown, string>();

  /** The plan function's own temporaries. */
  get locals(): ReadonlyArray<string> {
    return this.#frames[0]!.locals;
  }

  /** The plan function's statements, in evaluation order. */
  get statements(): ReadonlyArray<string> {
    return this.#frames[0]!.statements;
  }

  /** Emits a node's statements and returns the reference that holds its value. */
  expression(node: PlanNode): string {
    switch (node.kind) {
      case "construct":
        return this.#define(`new ${this.#slot(node.target, "C")}(${this.#list(node.deps)})`);
      case "accessors":
        return this.#define(`${this.#slot(node.construct, "A")}([${this.#list(node.deps)}])`);
      case "call": {
        // The settle only ever throws, so it runs on the promise branch alone and the plain result stands.
        const local = this.#define(`${this.#slot(node.factory, "F")}(${this.#list(node.deps)})`);
        this.#statement(
          `if (${local} instanceof ${this.#slot(Promise, "P")}) ${local} = ${this.#slot(node.settle, "S")}(${local});`,
        );
        return local;
      }
      case "value":
        return this.#slot(node.value, "V");
      case "singleton":
        return this.#singletonRead(node.binding, node.escape);
      case "thunk":
        return this.#define(`${this.#slot(node.run, "T")}()`);
    }
  }

  asyncExpression(node: AsyncPlanNode): string {
    switch (node.kind) {
      case "construct": {
        const target = this.#slot(node.target, "C");
        return node.awaits
          ? this.#settled(node.deps, (values) => `new ${target}(${values})`)
          : this.#define(`new ${target}(${this.#asyncList(node.deps)})`);
      }
      case "call": {
        const factory = this.#slot(node.factory, "F");
        return node.awaits
          ? this.#settled(node.deps, (values) => `${factory}(${values})`)
          : this.#define(`${factory}(${this.#asyncList(node.deps)})`);
      }
      case "value":
        return this.#slot(node.value, "V");
      case "singleton":
        return this.#singletonRead(node.binding, node.escape);
      case "thunk":
        return this.#define(`${this.#slot(node.run, "T")}()`);
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
    const frame = { locals: [] as Array<string>, statements: [] as Array<string> };
    this.#frames.push(frame);
    const pendings: Array<string> = [];
    for (let position = 0; position < deps.length; position += 1) {
      const pending = `p${String(position)}`;
      pendings.push(pending);
      // A dependency's own statements run inside its try, so its sync throw is its rejection alone.
      const mark = frame.statements.length;
      const reference = this.asyncExpression(deps[position]!);
      const inner = frame.statements.splice(mark).join("");
      frame.statements.push(`try{${inner}${pending}=${reference};}catch(e){${pending}=${reject}(e);}`);
    }
    this.#frames.pop();
    const locals = [...pendings, ...frame.locals];
    // One dependency has one outcome, so there is nothing to order and no fan-out to settle.
    const settled =
      deps.length === 1
        ? `const ${applyName}=(v0)=>${apply("v0")};const ${name}=()=>{let ${locals.join(",")};${frame.statements.join("")}return ${this.#slot(Promise, "P")}.resolve(p0).then(${applyName});};`
        : `const ${applyName}=(v)=>${apply(deps.map((_dep, position) => `v[${String(position)}]`).join(","))};const ${name}=()=>{let ${locals.join(",")};${frame.statements.join("")}return ${this.#slot(settleInOrder, "W")}([${pendings.join(",")}],${applyName});};`;
    this.hoisted.push(settled);
    return this.#define(`${name}()`);
  }

  #define(expression: string): string {
    const local = this.#local();
    this.#statement(`${local} = ${expression};`);
    return local;
  }

  #statement(statement: string): void {
    this.#frames.at(-1)!.statements.push(statement);
  }

  #local(): string {
    const locals = this.#frames.at(-1)!.locals;
    const local = `t${String(locals.length)}`;
    locals.push(local);
    return local;
  }

  #singletonRead(binding: Binding, escape: () => unknown): string {
    const local = this.#define(`${this.#slot(binding, "B")}.instance`);
    this.#statement(`if (${local} === ${this.#slot(NO_INSTANCE, "N")}) ${local} = ${this.#slot(escape, "E")}();`);
    return local;
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
