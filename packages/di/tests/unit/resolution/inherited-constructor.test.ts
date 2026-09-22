/**
 * Constructor injection is opt-in per class: a subclass that inherits declared deps but declares
 * none of its own is rejected, not built with `undefined` arguments.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import { injectable } from "#decorators/injectable";
import { MissingMetadataError } from "#errors/errors";

const depToken = token<string>("ic:dep");

describe("a subclass that inherits declared constructor deps", () => {
  it("resolves a base that declares its own deps", () => {
    @injectable([depToken])
    class Base {
      constructor(readonly dep: string) {}
    }
    const container = Container.create();
    container.bind(depToken).toConstantValue("d");
    container.bind(Base).toSelf().transient();

    expect(container.resolve(Base).dep).toBe("d");
  });

  it("rejects a subclass with an implicit constructor and no own metadata", () => {
    @injectable([depToken])
    class Base {
      constructor(readonly dep: string) {}
    }
    class DerivedNoCtor extends Base {}
    const container = Container.create();
    container.bind(depToken).toConstantValue("d");
    container.bind(DerivedNoCtor).toSelf().transient();

    expect(() => container.resolve(DerivedNoCtor)).toThrow(MissingMetadataError);
    expect(() => container.resolve(DerivedNoCtor)).toThrow(/inherits 1 declared constructor dependency from 'Base'/);
  });

  it("rejects the subclass on the async lane too", async () => {
    @injectable([depToken])
    class Base {
      constructor(readonly dep: string) {}
    }
    class DerivedNoCtor extends Base {}
    const container = Container.create();
    container.bind(depToken).toConstantValue("d");
    container.bind(DerivedNoCtor).toSelf().transient();

    await expect(container.resolveAsync(DerivedNoCtor)).rejects.toThrow(MissingMetadataError);
  });

  it("builds a subclass that declares its own empty deps with @injectable([])", () => {
    @injectable([depToken])
    class Base {
      constructor(readonly dep: string) {}
    }
    @injectable([])
    class DerivedEmpty extends Base {
      constructor() {
        super("own");
      }
    }
    const container = Container.create();
    container.bind(depToken).toConstantValue("d");
    container.bind(DerivedEmpty).toSelf().transient();

    expect(container.resolve(DerivedEmpty).dep).toBe("own");
  });

  it("rejects a subclass that adds a constructor but no metadata", () => {
    @injectable([depToken])
    class Base {
      constructor(readonly dep: string) {}
    }
    class DerivedWithCtor extends Base {
      constructor(dep: string) {
        super(dep);
      }
    }
    const container = Container.create();
    container.bind(depToken).toConstantValue("d");
    container.bind(DerivedWithCtor).toSelf().transient();

    expect(() => container.resolve(DerivedWithCtor)).toThrow(MissingMetadataError);
  });
});
