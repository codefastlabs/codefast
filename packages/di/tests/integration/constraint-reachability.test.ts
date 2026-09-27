/**
 * Constraints that can never hold. An empty criteria list reads as a requirement but matches any
 * ancestor, and a misspelled slot name matches none — both used to resolve to the default binding
 * with nothing reported, which looks identical to the constraint simply not applying.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { slotName, tag } from "#core/tag";
import { token } from "#core/token";
import { EmptyTagCriteriaError, UnreachableConstraintError } from "#errors";
import {
  whenAnyAncestorNamed,
  whenAnyAncestorTagged,
  whenAnyAncestorTaggedAll,
  whenParentNamed,
  whenParentTagged,
  whenParentTaggedAll,
} from "#index";

describe("a …TaggedAll constraint with no criteria", () => {
  it("refuses an empty list on whenParentTaggedAll", () => {
    expect(() => whenParentTaggedAll([])).toThrow(EmptyTagCriteriaError);
  });

  it("refuses an empty list on whenAnyAncestorTaggedAll", () => {
    expect(() => whenAnyAncestorTaggedAll([])).toThrow(EmptyTagCriteriaError);
  });

  it("names the helper that was called", () => {
    let caught: unknown;
    try {
      whenParentTaggedAll([]);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(EmptyTagCriteriaError);
    expect((caught as EmptyTagCriteriaError).helperName).toBe("whenParentTaggedAll");
    expect((caught as EmptyTagCriteriaError).code).toBe("EMPTY_TAG_CRITERIA");
  });

  it("still accepts a list with criteria in it", () => {
    const region = tag<string>("region");

    expect(() => whenParentTaggedAll([region.of("eu")])).not.toThrow();
  });
});

describe("container.validate() — a constraint waiting on a slot name", () => {
  it("throws when no binding declares the name the constraint waits for", () => {
    const loggerToken = token<string>("unreachable-name-logger");
    const consumerToken = token<string>("unreachable-name-consumer");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container.bind(loggerToken).when(whenParentNamed(consumerToken, "no-such-name")).toConstantValue("constrained");

    expect(() => {
      container.validate();
    }).toThrow(UnreachableConstraintError);
  });

  it("names the token, the required name, the required token and the helper", () => {
    const loggerToken = token<string>("unreachable-name-detail");
    const consumerToken = token<string>("unreachable-name-detail-consumer");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container.bind(loggerToken).when(whenAnyAncestorNamed(consumerToken, "typo")).toConstantValue("constrained");

    let caught: unknown;
    try {
      container.validate();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(UnreachableConstraintError);
    expect((caught as UnreachableConstraintError).tokenName).toBe("unreachable-name-detail");
    expect((caught as UnreachableConstraintError).requiredName).toBe("typo");
    expect((caught as UnreachableConstraintError).requiredTokenName).toBe("unreachable-name-detail-consumer");
    expect((caught as UnreachableConstraintError).helperName).toBe("whenAnyAncestorNamed");
    expect((caught as UnreachableConstraintError).code).toBe("UNREACHABLE_CONSTRAINT");
    expect((caught as UnreachableConstraintError).message).toContain(
      "no binding for 'unreachable-name-detail-consumer'",
    );
  });

  // The name is a label on one token's slots, so the same string on another token does not reach it.
  it("throws when only a different token declares the name", () => {
    const loggerToken = token<string>("wrong-token-logger");
    const consumerToken = token<string>("wrong-token-consumer");
    const bystanderToken = token<string>("wrong-token-bystander");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container.bind(loggerToken).when(whenParentNamed(consumerToken, "reporting")).toConstantValue("constrained");
    container.bind(bystanderToken).whenNamed("reporting").toConstantValue("bystander");

    expect(() => {
      container.validate();
    }).toThrow(UnreachableConstraintError);
  });

  // A name spelled through the tag lane is the same bare string, so it is checked the same way.
  it("checks a reserved-key criterion handed to the tagged helpers", () => {
    const loggerToken = token<string>("tag-lane-logger");
    const region = tag<string>("tag-lane-region");

    for (const constraint of [
      whenParentTagged(slotName.of("tag-lane-typo")),
      whenAnyAncestorTagged(slotName.of("tag-lane-typo")),
      whenParentTaggedAll([region.of("eu"), slotName.of("tag-lane-typo")]),
      whenAnyAncestorTaggedAll([slotName.of("tag-lane-typo"), region.of("eu")]),
    ]) {
      const container = Container.create();
      container.bind(loggerToken).toConstantValue("default");
      container.bind(loggerToken).when(constraint).toConstantValue("constrained");

      let caught: unknown;
      try {
        container.validate();
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(UnreachableConstraintError);
      expect((caught as UnreachableConstraintError).requiredName).toBe("tag-lane-typo");
      expect((caught as UnreachableConstraintError).requiredTokenName).toBeUndefined();
    }
  });

  // Without a token the tag-lane spelling is satisfied by any token declaring the name.
  it("accepts a reserved-key criterion some binding of any token declares", () => {
    const loggerToken = token<string>("tag-lane-reachable-logger");
    const consumerToken = token<string>("tag-lane-reachable-consumer");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container
      .bind(loggerToken)
      .when(whenParentTagged(slotName.of("reporting")))
      .toConstantValue("constrained");
    container.bind(consumerToken).whenNamed("reporting").toConstantValue("consumer");

    expect(() => {
      container.validate();
    }).not.toThrow();
  });

  it("leaves a tagged helper carrying only typed-key criteria without a requirement", () => {
    const loggerToken = token<string>("typed-key-only-logger");
    const region = tag<string>("typed-key-only-region");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container
      .bind(loggerToken)
      .when(whenParentTagged(region.of("nowhere")))
      .toConstantValue("constrained");

    expect(() => {
      container.validate();
    }).not.toThrow();
  });

  it("accepts a name some binding declares", () => {
    const loggerToken = token<string>("reachable-name-logger");
    const consumerToken = token<string>("reachable-name-consumer");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container.bind(loggerToken).when(whenParentNamed(consumerToken, "reporting")).toConstantValue("constrained");
    container.bind(consumerToken).whenNamed("reporting").toConstantValue("consumer");

    expect(() => {
      container.validate();
    }).not.toThrow();
  });

  // A child resolves through its parent, so a name the parent declares is reachable from here.
  it("accepts a name declared only in the parent container", () => {
    const loggerToken = token<string>("parent-declared-logger");
    const consumerToken = token<string>("parent-declared-consumer");

    const parent = Container.create();
    parent.bind(consumerToken).whenNamed("reporting").toConstantValue("consumer");

    const child = parent.createChild();
    child.bind(loggerToken).toConstantValue("default");
    child.bind(loggerToken).when(whenParentNamed(consumerToken, "reporting")).toConstantValue("constrained");

    expect(() => {
      child.validate();
    }).not.toThrow();
  });

  it("leaves a plain predicate alone, since it declares no requirement", () => {
    const loggerToken = token<string>("plain-predicate");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container
      .bind(loggerToken)
      .when((constraintContext) => constraintContext.parent !== undefined)
      .toConstantValue("constrained");

    expect(() => {
      container.validate();
    }).not.toThrow();
  });

  // The requirement rides on the predicate, and a chained `when()` composes two of them.
  it("still sees the requirement when a later when() narrows the chain", () => {
    const loggerToken = token<string>("composed-requirement");
    const consumerToken = token<string>("composed-requirement-consumer");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container
      .bind(loggerToken)
      .when(whenParentNamed(consumerToken, "absent"))
      .when(() => true)
      .toConstantValue("constrained");

    // The composed closure carries both sides' requirements, so the unreachable name still reports.
    expect(() => {
      container.validate();
    }).toThrow(UnreachableConstraintError);
  });

  it("sees a requirement contributed by either side of the composition", () => {
    const loggerToken = token<string>("composed-requirement-late");
    const consumerToken = token<string>("composed-requirement-late-consumer");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container
      .bind(loggerToken)
      .when(() => true)
      .when(whenAnyAncestorNamed(consumerToken, "absent"))
      .toConstantValue("constrained");

    expect(() => {
      container.validate();
    }).toThrow(UnreachableConstraintError);
  });

  it("accepts a composed chain whose required names are all declared", () => {
    const loggerToken = token<string>("composed-requirement-satisfied");

    const container = Container.create();
    container.bind(loggerToken).whenNamed("present").toConstantValue("default");
    container
      .bind(loggerToken)
      .when(whenParentNamed(loggerToken, "present"))
      .when(whenAnyAncestorNamed(loggerToken, "present"))
      .toConstantValue("constrained");

    expect(() => {
      container.validate();
    }).not.toThrow();
  });
});
