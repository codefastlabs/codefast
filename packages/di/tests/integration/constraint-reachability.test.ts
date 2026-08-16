/**
 * Constraints that can never hold. An empty criteria list reads as a requirement but matches any
 * ancestor, and a misspelled slot name matches none — both used to resolve to the default binding
 * with nothing reported, which looks identical to the constraint simply not applying.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { tag } from "#/core/tag";
import { token } from "#/core/token";
import { EmptyTagCriteriaError, UnreachableConstraintError } from "#/errors/errors";
import { whenAnyAncestorNamed, whenAnyAncestorTaggedAll, whenParentNamed, whenParentTaggedAll } from "#/index";

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

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container.bind(loggerToken).toConstantValue("constrained").when(whenParentNamed("no-such-name"));

    expect(() => {
      container.validate();
    }).toThrow(UnreachableConstraintError);
  });

  it("names the token, the required name and the helper", () => {
    const loggerToken = token<string>("unreachable-name-detail");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container.bind(loggerToken).toConstantValue("constrained").when(whenAnyAncestorNamed("typo"));

    let caught: unknown;
    try {
      container.validate();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(UnreachableConstraintError);
    expect((caught as UnreachableConstraintError).requiredName).toBe("typo");
    expect((caught as UnreachableConstraintError).helperName).toBe("whenAnyAncestorNamed");
    expect((caught as UnreachableConstraintError).code).toBe("UNREACHABLE_CONSTRAINT");
  });

  it("accepts a name some binding declares", () => {
    const loggerToken = token<string>("reachable-name-logger");
    const consumerToken = token<string>("reachable-name-consumer");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container.bind(loggerToken).toConstantValue("constrained").when(whenParentNamed("reporting"));
    container.bind(consumerToken).toConstantValue("consumer").whenNamed("reporting");

    expect(() => {
      container.validate();
    }).not.toThrow();
  });

  // A child resolves through its parent, so a name the parent declares is reachable from here.
  it("accepts a name declared only in the parent container", () => {
    const loggerToken = token<string>("parent-declared-logger");
    const consumerToken = token<string>("parent-declared-consumer");

    const parent = Container.create();
    parent.bind(consumerToken).toConstantValue("consumer").whenNamed("reporting");

    const child = parent.createChild();
    child.bind(loggerToken).toConstantValue("default");
    child.bind(loggerToken).toConstantValue("constrained").when(whenParentNamed("reporting"));

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
      .toConstantValue("constrained")
      .when((constraintContext) => constraintContext.parent !== undefined);

    expect(() => {
      container.validate();
    }).not.toThrow();
  });

  // The requirement rides on the predicate, and a chained `when()` composes two of them.
  it("still sees the requirement when a later when() narrows the chain", () => {
    const loggerToken = token<string>("composed-requirement");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container
      .bind(loggerToken)
      .toConstantValue("constrained")
      .when(whenParentNamed("absent"))
      .when(() => true);

    // The composed closure carries both sides' requirements, so the unreachable name still reports.
    expect(() => {
      container.validate();
    }).toThrow(UnreachableConstraintError);
  });

  it("sees a requirement contributed by either side of the composition", () => {
    const loggerToken = token<string>("composed-requirement-late");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default");
    container
      .bind(loggerToken)
      .toConstantValue("constrained")
      .when(() => true)
      .when(whenAnyAncestorNamed("absent"));

    expect(() => {
      container.validate();
    }).toThrow(UnreachableConstraintError);
  });

  it("accepts a composed chain whose required names are all declared", () => {
    const loggerToken = token<string>("composed-requirement-satisfied");

    const container = Container.create();
    container.bind(loggerToken).toConstantValue("default").whenNamed("present");
    container
      .bind(loggerToken)
      .toConstantValue("constrained")
      .when(whenParentNamed("present"))
      .when(whenAnyAncestorNamed("present"));

    expect(() => {
      container.validate();
    }).not.toThrow();
  });
});
