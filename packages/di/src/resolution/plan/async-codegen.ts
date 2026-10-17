import type { Binding } from "#core/binding";
import type { ConstructorInvocation } from "#core/constructor-type";
/** Generates a hot async instantiation plan as a function of its own, apart from the sync generator. */
import { settleInOrder } from "#resolution/async-fan-out";
import { compileRendered, isPlanCodegenAvailable, PlanEmitter } from "#resolution/plan/codegen";

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
  return compileRendered(emitter, new AsyncPlanRenderer(emitter).expression(node));
}

/** Renders an async plan tree through a sync emitter's statements, awaiting where a node's dependencies may yield. */
class AsyncPlanRenderer {
  readonly #emitter: PlanEmitter;

  constructor(emitter: PlanEmitter) {
    this.#emitter = emitter;
  }

  expression(node: AsyncPlanNode): string {
    switch (node.kind) {
      case "construct": {
        const target = this.#emitter.slot(node.target, "C");
        return node.awaits
          ? this.#settled(node.deps, (values) => `new ${target}(${values})`)
          : this.#emitter.define(`new ${target}(${this.#list(node.deps)})`);
      }
      case "call": {
        const factory = this.#emitter.slot(node.factory, "F");
        return node.awaits
          ? this.#settled(node.deps, (values) => `${factory}(${values})`)
          : this.#emitter.define(`${factory}(${this.#list(node.deps)})`);
      }
      case "value":
        return this.#emitter.slot(node.value, "V");
      case "singleton":
        return this.#emitter.singletonRead(node.binding, node.escape);
      case "thunk":
        return this.#emitter.define(`${this.#emitter.slot(node.run, "T")}()`);
    }
  }

  #list(deps: ReadonlyArray<AsyncPlanNode>): string {
    return deps.map((dep) => this.expression(dep)).join(", ");
  }

  // Every dependency starts in order, a sync throw becomes that slot's rejection so its siblings still
  // start, and the node applies to the settled values — the interpreted async path, rendered.
  #settled(deps: ReadonlyArray<AsyncPlanNode>, apply: (values: string) => string): string {
    const index = this.#emitter.nextHoistedIndex();
    const name = `n${String(index)}`;
    const applyName = `a${String(index)}`;
    const reject = this.#emitter.slot(rejectWith, "R");
    const frame = this.#emitter.openFrame();
    const pendings: Array<string> = [];
    for (let position = 0; position < deps.length; position += 1) {
      const pending = `p${String(position)}`;
      pendings.push(pending);
      // A dependency's own statements run inside its try, so its sync throw is its rejection alone.
      const mark = frame.statements.length;
      const reference = this.expression(deps[position]!);
      const inner = frame.statements.splice(mark).join("");
      frame.statements.push(`try{${inner}${pending}=${reference};}catch(e){${pending}=${reject}(e);}`);
    }
    this.#emitter.closeFrame();
    const locals = [...pendings, ...frame.locals];
    // One dependency has one outcome, so there is nothing to order and no fan-out to settle.
    const settled =
      deps.length === 1
        ? `const ${applyName}=(v0)=>${apply("v0")};const ${name}=()=>{let ${locals.join(",")};${frame.statements.join("")}return ${this.#emitter.slot(Promise, "P")}.resolve(p0).then(${applyName});};`
        : `const ${applyName}=(v)=>${apply(deps.map((_dep, position) => `v[${String(position)}]`).join(","))};const ${name}=()=>{let ${locals.join(",")};${frame.statements.join("")}return ${this.#emitter.slot(settleInOrder, "W")}([${pendings.join(",")}],${applyName});};`;
    this.#emitter.hoisted.push(settled);
    return this.#emitter.define(`${name}()`);
  }
}
