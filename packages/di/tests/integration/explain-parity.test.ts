/**
 * `explain()` walks the full lookup path while `resolve` takes whichever fast lane fits, so for any bindings on a root
 * and its child, and any request, the binding `explain()` selects is the one `resolve` answers with, and a lookup
 * that selects none ends with the outcome that names the error `resolve` throws.
 */
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { tag } from "#core/tag";
import { token } from "#core/token";
import type { Token } from "#core/token";
import type { BindingIdentifier, ResolveOptions } from "#core/types";
import {
  AmbiguousBindingError,
  CircularDependencyError,
  NoMatchingBindingError,
  TokenNotBoundError,
} from "#errors/errors";
import type { ExplanationOutcome } from "#introspection/explanation";

const REGION = tag("explain-parity:region");
const NAME = "primary";

type Shape = "default" | "named" | "tagged" | "named-tagged" | "member" | "alias";

/** One bind a run makes: on which container, under which token, in which slot, guarded or not. */
interface BindStep {
  readonly onChild: boolean;
  readonly tokenIndex: number;
  readonly shape: Shape;
  readonly guard: "none" | "accepts" | "refuses";
  readonly aliasTarget: number;
}

const bindStep: fc.Arbitrary<BindStep> = fc.record({
  onChild: fc.boolean(),
  tokenIndex: fc.integer({ min: 0, max: 1 }),
  shape: fc.constantFrom<Shape>("default", "named", "tagged", "named-tagged", "member", "alias"),
  guard: fc.constantFrom("none", "accepts", "refuses"),
  aliasTarget: fc.integer({ min: 0, max: 1 }),
});

const REQUESTS: ReadonlyArray<ResolveOptions | undefined> = [
  undefined,
  { name: NAME },
  { tag: REGION.of("eu") },
  { name: NAME, tags: [REGION.of("eu")] },
];

function outcomeOf(error: unknown): ExplanationOutcome {
  if (error instanceof TokenNotBoundError) {
    return "unbound";
  }
  if (error instanceof NoMatchingBindingError) {
    return "unmatched";
  }
  if (error instanceof AmbiguousBindingError) {
    return "ambiguous";
  }
  if (error instanceof CircularDependencyError) {
    return "alias-cycle";
  }
  throw error;
}

function applyBind(
  step: BindStep,
  containers: { readonly root: Container; readonly child: Container },
  tokens: ReadonlyArray<Token<number>>,
  ids: Map<number, BindingIdentifier>,
  value: number,
): void {
  const container = step.onChild ? containers.child : containers.root;
  const serviceToken = tokens[step.tokenIndex]!;
  if (step.shape === "alias") {
    const target = tokens[step.aliasTarget]!;
    if (target !== serviceToken) {
      container.bind(serviceToken).toAlias(target);
    }
    return;
  }
  const chain = container.bind(serviceToken).toConstantValue(value);
  ids.set(value, chain.id());
  if (step.shape === "member") {
    chain.many();
    return;
  }
  if (step.shape === "named" || step.shape === "named-tagged") {
    chain.whenNamed(NAME);
  }
  if (step.shape === "tagged" || step.shape === "named-tagged") {
    chain.whenTagged(REGION.of("eu"));
  }
  if (step.guard !== "none") {
    const accepts = step.guard === "accepts";
    chain.when(() => accepts);
  }
}

describe("explain() against resolve", () => {
  it("selects the binding resolve answers with, and ends where resolve throws", () => {
    fc.assert(
      fc.property(fc.array(bindStep, { maxLength: 8 }), (steps) => {
        const root = Container.create();
        const containers = { root, child: root.createChild() };
        const tokens = [token<number>("explain-parity:First"), token<number>("explain-parity:Second")];
        const ids = new Map<number, BindingIdentifier>();
        steps.forEach((step, index) => {
          applyBind(step, containers, tokens, ids, index);
        });

        for (const container of [containers.root, containers.child]) {
          for (const serviceToken of tokens) {
            for (const request of REQUESTS) {
              const explanation = container.explain(serviceToken, request);
              let resolved: number | undefined;
              let outcome: ExplanationOutcome = "selected";
              try {
                resolved = container.resolve(serviceToken, request);
              } catch (error) {
                outcome = outcomeOf(error);
              }
              expect(explanation.outcome).toBe(outcome);
              expect(explanation.selected?.id).toBe(resolved === undefined ? undefined : ids.get(resolved));
            }
          }
        }
      }),
      { numRuns: 400 },
    );
  });
});
