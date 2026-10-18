/**
 * Every place a binding starts is typed by one `Binder`, and `@injectable()` refuses a constructor it would starve.
 */
import { describe, expectTypeOf, it } from "vitest";

import type { Container } from "#container/container";
import { Container as ContainerStatic } from "#container/container";
import type { Binder, BindToBuilder, ClassBindToBuilder } from "#core/binding-builders";
import type { AsyncModuleBuilder, ModuleBuilder } from "#core/module";
import { Module } from "#core/module";
import { token } from "#core/token";
import { injectable } from "#decorators/injectable";

interface Logger {
  log(message: string): void;
}
const LoggerToken = token<Logger, "primary" | "backup">("test:Logger");
class ConsoleLogger implements Logger {
  log(): void {}
}

describe("one Binder behind every bind()", () => {
  it("is what a container and both module builders bind through", () => {
    expectTypeOf<Container>().toExtend<Binder>();
    expectTypeOf<ModuleBuilder>().toExtend<Binder>();
    expectTypeOf<AsyncModuleBuilder>().toExtend<Binder>();
    expectTypeOf<Container["rebind"]>().toEqualTypeOf<Container["bind"]>();
  });

  it("narrows slot names inside a module exactly as on a container", () => {
    ContainerStatic.create().bind(LoggerToken).whenNamed("primary").to(ConsoleLogger);
    Module.create("test:Names", (builder) => {
      expectTypeOf(builder.bind(LoggerToken)).toEqualTypeOf<BindToBuilder<Logger, "primary" | "backup">>();
      builder.bind(LoggerToken).whenNamed("primary").to(ConsoleLogger);
      // @ts-expect-error — the token declares no such slot name.
      builder.bind(LoggerToken).whenNamed("tertiary").to(ConsoleLogger);
    });
    Module.createAsync("test:AsyncNames", async (builder) => {
      // @ts-expect-error — the async builder narrows names too.
      builder.bind(LoggerToken).whenNamed("tertiary").to(ConsoleLogger);
    });
  });

  it("offers toSelf() on a class key's chain and not on a token's", () => {
    const container = ContainerStatic.create();
    expectTypeOf(container.bind(ConsoleLogger)).toEqualTypeOf<ClassBindToBuilder<ConsoleLogger>>();
    expectTypeOf(container.bind(LoggerToken)).toEqualTypeOf<BindToBuilder<Logger, "primary" | "backup">>();
    container.bind(ConsoleLogger).toSelf();
    // Never called: these must fail to compile, and running them would throw the runtime guard.
    const rejected = (): void => {
      // @ts-expect-error — a token names no class to construct.
      container.bind(LoggerToken).toSelf();
      // @ts-expect-error — nor does a key typed as either, since it may be a token.
      container.bind(LoggerToken as typeof LoggerToken | typeof ConsoleLogger).toSelf();
    };
    expectTypeOf(rejected).toBeFunction();
  });
});

describe("@injectable() with no deps", () => {
  it("accepts a constructor that needs nothing", () => {
    @injectable()
    class Bare {}

    @injectable()
    class WithOptional {
      constructor(readonly logger?: Logger) {}
    }

    expectTypeOf<Bare>().toBeObject();
    expectTypeOf<WithOptional>().toBeObject();
  });

  it("refuses a constructor with a required parameter, inherited ones included", () => {
    // @ts-expect-error — nothing would be handed to `logger`.
    @injectable()
    class NeedsLogger {
      constructor(readonly logger: Logger) {}
    }

    @injectable([LoggerToken])
    class Base {
      constructor(readonly logger: Logger) {}
    }

    // @ts-expect-error — the subclass inherits a constructor that needs a logger.
    @injectable()
    class Child extends Base {}

    expectTypeOf<NeedsLogger>().toBeObject();
    expectTypeOf<Child>().toBeObject();
  });
});
