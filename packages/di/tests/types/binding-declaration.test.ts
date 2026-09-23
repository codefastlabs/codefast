import { describe, expect, expectTypeOf, it } from "vitest";

import { binding } from "#core/binding-declaration";
import type { BindingDeclaration } from "#core/binding-declaration";
import { Module } from "#core/module";
import type { SyncModule } from "#core/module";
import { tag } from "#core/tag";
import { token } from "#core/token";
import { InvalidBindingDeclarationError, ManyBindingSlotError, SelfBindingRequiresClassError } from "#errors/errors";
import { optional } from "#injection/descriptor";

interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(): void {}
}

class NotALogger {
  readonly shape = "other";
}

class Clock {
  readonly now = 0;
}

const LoggerToken = token<Logger, "console" | "file">("bd-types:Logger");
const Port = token<number>("bd-types:Port");
const Region = tag<"eu" | "us">("bd-types:region");
const Size = tag<"s" | "l">("bd-types:size");

describe("a binding definition is typed exactly as the chain is", () => {
  it("takes its value type from the key and never widens it", () => {
    expectTypeOf(binding(LoggerToken, { to: ConsoleLogger })).toEqualTypeOf<BindingDeclaration>();
    // @ts-expect-error a class that is not the token's value
    binding(LoggerToken, { to: NotALogger });
    // @ts-expect-error a constant that is not the token's value
    binding(Port, { toConstantValue: "8080" });
    // @ts-expect-error a factory that does not return the token's value
    binding(Port, { toDynamic: () => "8080" });
  });

  it("names exactly one strategy", () => {
    // @ts-expect-error two strategies
    expect(() => binding(Port, { toConstantValue: 1, toDynamic: () => 2 })).toThrow(InvalidBindingDeclarationError);
    // @ts-expect-error no strategy
    expect(() => binding(Port, { scope: "singleton" })).toThrow(InvalidBindingDeclarationError);
  });

  it("keeps scope off a constant and an alias, and hooks off an alias", () => {
    binding(Port, { toConstantValue: 1, onActivation: (_ctx, port) => port, onDeactivation: () => {} });
    binding(LoggerToken, { toAlias: LoggerToken });
    // @ts-expect-error a scope on a constant
    expect(() => binding(Port, { toConstantValue: 1, scope: "singleton" })).toThrow(InvalidBindingDeclarationError);
    // @ts-expect-error a scope on an alias
    expect(() => binding(LoggerToken, { toAlias: LoggerToken, scope: "transient" })).toThrow(
      InvalidBindingDeclarationError,
    );
    // @ts-expect-error a hook on an alias
    expect(() => binding(LoggerToken, { toAlias: LoggerToken, onActivation: (_ctx, logger) => logger })).toThrow(
      InvalidBindingDeclarationError,
    );
  });

  it("offers onDeactivation only to a singleton", () => {
    binding(LoggerToken, { to: ConsoleLogger, scope: "singleton", onDeactivation: (logger) => logger.log("bye") });
    binding(LoggerToken, { to: ConsoleLogger, scope: "scoped", onActivation: (_ctx, logger) => logger });
    expect(() =>
      // @ts-expect-error onDeactivation on a transient
      binding(LoggerToken, { to: ConsoleLogger, scope: "transient", onDeactivation: () => {} }),
    ).toThrow(InvalidBindingDeclarationError);
    // @ts-expect-error onDeactivation with the default, transient scope
    expect(() => binding(LoggerToken, { to: ConsoleLogger, onDeactivation: () => {} })).toThrow(
      InvalidBindingDeclarationError,
    );
  });

  it("keeps a collection member off every slot", () => {
    binding(Port, { toConstantValue: 3, many: true });
    // @ts-expect-error a member with a name
    expect(() => binding(LoggerToken, { to: ConsoleLogger, many: true, whenNamed: "file" })).toThrow(
      ManyBindingSlotError,
    );
    // @ts-expect-error a member with a criterion
    expect(() => binding(Port, { toConstantValue: 3, many: true, whenTagged: Region.of("eu") })).toThrow(
      ManyBindingSlotError,
    );
  });

  it("allows toSelf only on a class key", () => {
    binding(Clock, { toSelf: true, scope: "singleton" });
    // @ts-expect-error toSelf on a token
    expect(() => binding(Port, { toSelf: true })).toThrow(SelfBindingRequiresClassError);
  });

  it("infers a resolved factory's parameters from its deps", () => {
    binding(Port, {
      toResolved: (port, logger, clock) => {
        expectTypeOf(port).toEqualTypeOf<number>();
        expectTypeOf(logger).toEqualTypeOf<Logger>();
        expectTypeOf(clock).toEqualTypeOf<Clock | undefined>();
        return port;
      },
      deps: [Port, LoggerToken, optional(Clock)],
    });
    binding(Port, { toResolvedAsync: async (port) => port, deps: [Port] });
    // @ts-expect-error a parameter that does not match its dependency
    binding(Port, { toResolved: (port: string) => port.length, deps: [Port] });
    // @ts-expect-error deps without a resolved strategy
    expect(() => binding(Port, { toConstantValue: 1, deps: [Port] })).toThrow(InvalidBindingDeclarationError);
  });

  it("narrows whenNamed to the token's names and takes one criterion or several", () => {
    binding(LoggerToken, { to: ConsoleLogger, whenNamed: "file" });
    // @ts-expect-error a name the token does not declare
    binding(LoggerToken, { to: ConsoleLogger, whenNamed: "fiel" });
    binding(LoggerToken, { to: ConsoleLogger, whenTagged: Region.of("eu") });
    expectTypeOf(
      binding(LoggerToken, { to: ConsoleLogger, whenTagged: [Region.of("eu"), Size.of("l")] }),
    ).toEqualTypeOf<BindingDeclaration>();
  });

  it("groups declarations of different value types into one module", () => {
    const declared = Module.fromBindings("bd-types:Infra", [
      binding(LoggerToken, { to: ConsoleLogger, scope: "singleton" }),
      binding(Port, { toConstantValue: 8080 }),
      binding(Clock, { toSelf: true }),
    ]);

    expectTypeOf(declared).toEqualTypeOf<SyncModule>();
  });
});
