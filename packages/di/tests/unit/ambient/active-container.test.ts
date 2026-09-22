/**
 * The ambient container `runWithContainer` opens and the error a missing one raises.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import { inject } from "#decorators/inject";
import { injectable } from "#decorators/injectable";
import { MissingContainerContextError } from "#errors/errors";
import { getActiveContainer, runWithContainer } from "#index";

describe("runWithContainer", () => {
  it("installs the container for the synchronous run and restores it after", () => {
    const container = Container.create();

    expect(getActiveContainer()).toBeUndefined();
    const seen = runWithContainer(container, () => getActiveContainer());
    expect(seen).toBe(container);
    expect(getActiveContainer()).toBeUndefined();
  });

  it("the missing-context error explains the context does not survive an await", () => {
    const dep = token<string>("rwc:dep");

    @injectable([])
    class Holder {
      @inject(dep) accessor value!: string;
    }

    let caught: unknown;
    try {
      new Holder();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(MissingContainerContextError);
    expect((caught as MissingContainerContextError).message).toContain("does not survive an await");
  });
});
