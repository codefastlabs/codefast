/**
 * Generates a hot instantiation plan as a function of its own, so its call sites answer for one plan only.
 */
import type { Binding } from "#/core/binding";
import { NO_INSTANCE } from "#/core/binding";
import type { ConstructorInvocation } from "#/core/constructor-type";

/**
 * Runs a plan's closure makes before the plan is generated as its own function.
 *
 * @remarks Below it a plan stays a closure, which is all a cold container or a per-request child
 * ever runs; above it a plan pays one compile for call sites nothing else feeds.
 */
export const PLAN_CODEGEN_THRESHOLD = 32;

/**
 * The shape of a compiled sync plan: what its closure does, stated as data the generator can read.
 *
 * @remarks Every leaf the compiler could not see through is a `thunk` and stays opaque — generated
 * code calls it exactly as the closure did, so an escape keeps its frames, its dispatch and its errors.
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

let codegenAvailable: boolean | undefined;
let generatedCount = 0;

/**
 * Whether this runtime lets the engine compile a function from source.
 *
 * @remarks A Content Security Policy without `unsafe-eval` refuses the `Function` constructor; every
 * plan then stays a closure, which behaves identically.
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
 */
export function generatePlan(node: PlanNode): (() => unknown) | null {
  if (!isPlanCodegenAvailable()) {
    return null;
  }
  const emitter = new PlanEmitter();
  const expression = emitter.expression(node);
  generatedCount += 1;
  const locals = emitter.locals.length === 0 ? "" : `let ${emitter.locals.join(", ")};`;
  const body = `"use strict";/* plan ${String(generatedCount)} */return () => {${locals}return ${expression};};`;
  try {
    // Compiling from source is the mechanism: one function literal per plan is what gives it its own feedback.
    // oxlint-disable-next-line typescript/no-implied-eval
    const factory = new Function(...emitter.names, body) as (...args: Array<unknown>) => () => unknown;
    return factory(...emitter.values);
  } catch {
    return null;
  }
}

/** Renders a plan tree as one expression over parameters that carry every value the plan closes over. */
class PlanEmitter {
  readonly names: Array<string> = [];
  readonly values: Array<unknown> = [];
  readonly locals: Array<string> = [];
  readonly #slotByValue = new Map<unknown, string>();

  expression(node: PlanNode): string {
    switch (node.kind) {
      case "construct":
        return `new ${this.#slot(node.target, "C")}(${this.#list(node.deps)})`;
      case "accessors":
        return `${this.#slot(node.construct, "A")}([${this.#list(node.deps)}])`;
      case "call":
        return `${this.#slot(node.settle, "S")}(${this.#slot(node.factory, "F")}(${this.#list(node.deps)}))`;
      case "value":
        return this.#slot(node.value, "V");
      case "singleton": {
        const local = `t${String(this.locals.length)}`;
        this.locals.push(local);
        const binding = this.#slot(node.binding, "B");
        return `((${local} = ${binding}.instance) === ${this.#slot(NO_INSTANCE, "N")} ? ${this.#slot(node.escape, "E")}() : ${local})`;
      }
      case "thunk":
        return `${this.#slot(node.run, "T")}()`;
    }
  }

  #list(deps: ReadonlyArray<PlanNode>): string {
    return deps.map((dep) => this.expression(dep)).join(", ");
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
