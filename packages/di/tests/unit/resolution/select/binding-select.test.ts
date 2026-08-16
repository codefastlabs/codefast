/**
 * Selection runs user code — a `when()` predicate — while walking the registry's own candidate
 * list. These pin what a predicate may do to that list without the walk losing its place.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";

describe("candidate list stability under a mutating predicate", () => {
  it("still evaluates every candidate when a predicate unbinds one mid-selection", () => {
    const serviceToken = token<string>("select-mid-unbind");
    const container = Container.create();
    const evaluated: Array<string> = [];

    // The registry replaces a token's list on mutation (copy-on-write), so an unbind mid-walk
    // must not shift the walk — every candidate registered when selection began stays offered.
    let alreadyUnbound = false;
    const firstId = container
      .bind(serviceToken)
      .toConstantValue("first")
      .when(() => {
        evaluated.push("first");
        if (!alreadyUnbound) {
          alreadyUnbound = true;
          container.unbind(firstId);
        }
        return true;
      })
      .id();
    container
      .bind(serviceToken)
      .toConstantValue("second")
      .when(() => {
        evaluated.push("second");
        return true;
      });
    container
      .bind(serviceToken)
      .toConstantValue("third")
      .when(() => {
        evaluated.push("third");
        return true;
      });

    const resolved = container.resolveAll(serviceToken);

    // Without a snapshot the walk skips "second": it moves to index 1 of a list that just lost
    // index 0. Every candidate registered when selection began must still be offered its predicate.
    expect(evaluated).toEqual(["first", "second", "third"]);
    expect(resolved).toEqual(["first", "second", "third"]);
  });

  it("leaves a predicate-free candidate list alone", () => {
    const serviceToken = token<string>("select-no-predicate");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("a").whenNamed("a");
    container.bind(serviceToken).toConstantValue("b").whenNamed("b");

    expect(container.resolveAll(serviceToken)).toEqual(["a", "b"]);
    expect(container.resolve(serviceToken, { name: "b" })).toBe("b");
  });
});
