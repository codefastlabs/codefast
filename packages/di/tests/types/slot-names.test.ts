import { describe, expect, expectTypeOf, it } from "vitest";

import { Container } from "#/container/container";
import type { SlotNamesOf, Token } from "#/core/token";
import { token } from "#/core/token";
import type { ResolveOptions } from "#/core/types";
import { inject } from "#/decorators/inject";
import { NoMatchingBindingError } from "#/errors/errors";
import type { InjectOptions } from "#/injection/descriptor";
import { injectAll, optional } from "#/injection/descriptor";

interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(): void {}
}

class FileLogger implements Logger {
  log(): void {}
}

const Named = token<Logger, "console" | "file">("slot-names.named");
const Unnamed = token<Logger>("slot-names.unnamed");

describe("a token declaring slot names narrows every `name` it meets", () => {
  it("whenNamed accepts only the declared names", () => {
    const container = Container.create();
    container.bind(Named).to(ConsoleLogger).whenNamed("console");
    container.bind(Named).to(FileLogger).whenNamed("file");
    // @ts-expect-error a name the token does not declare is a compile error
    container.bind(Named).to(FileLogger).whenNamed("fiel");

    expect(container.resolve(Named, { name: "file" })).toBeInstanceOf(FileLogger);
  });

  it("resolve, has and the descriptor factories narrow `name` from the token alone", () => {
    const container = Container.create();
    container.bind(Named).to(ConsoleLogger).whenNamed("console");

    expectTypeOf(container.resolve(Named, { name: "console" })).toEqualTypeOf<Logger>();
    expectTypeOf(container.resolveOptional(Named, { name: "console" })).toEqualTypeOf<Logger | undefined>();
    expectTypeOf(container.resolveAll(Named, { name: "console" })).toEqualTypeOf<Array<Logger>>();
    expect(container.has(Named, { name: "console" })).toBe(true);
    // @ts-expect-error the options side cannot widen the token's names
    expect(() => container.resolve(Named, { name: "consol" })).toThrow(NoMatchingBindingError);
    // @ts-expect-error the options side cannot widen the token's names
    container.has(Named, { name: "consol" });
    // @ts-expect-error the options side cannot widen the token's names
    inject(Named, { name: "consol" });
    // @ts-expect-error the options side cannot widen the token's names
    optional(Named, { name: "consol" });
    // @ts-expect-error the options side cannot widen the token's names
    injectAll(Named, { name: "consol" });

    expectTypeOf(inject(Named, { name: "file" }).token).toEqualTypeOf<
      Token<Logger> | (new (...args: Array<never>) => Logger)
    >();
  });

  it("a token declaring no names, and a class key, still take any string", () => {
    const container = Container.create();
    const free: string | undefined = "anything";
    container.bind(Unnamed).to(ConsoleLogger).whenNamed("anything");
    container.bind(ConsoleLogger).toSelf().whenNamed("anything");

    expectTypeOf(container.resolve(Unnamed, { name: free })).toEqualTypeOf<Logger>();
    expectTypeOf(container.resolve(ConsoleLogger, { name: free })).toEqualTypeOf<ConsoleLogger>();
    expect(container.resolve(Unnamed, { name: "anything" })).toBeInstanceOf(ConsoleLogger);
  });

  it("the names are a phantom: a declaring token is still a Token<unknown> to the engine", () => {
    const erased: Token<unknown> = Named;
    const widened: Token<Logger> = Named;
    // @ts-expect-error a token declaring names is not a token declaring other names
    const other: Token<Logger, "audit"> = Named;

    expectTypeOf<SlotNamesOf<typeof Named>>().toEqualTypeOf<"console" | "file">();
    expectTypeOf<SlotNamesOf<typeof Unnamed>>().toEqualTypeOf<string>();
    expectTypeOf<SlotNamesOf<typeof ConsoleLogger>>().toEqualTypeOf<string>();
    expectTypeOf<ResolveOptions<"console">["name"]>().toEqualTypeOf<"console" | undefined>();
    expectTypeOf<InjectOptions<"console">["name"]>().toEqualTypeOf<"console" | undefined>();
    expectTypeOf<ResolveOptions>().toEqualTypeOf<ResolveOptions<string>>();
    expect([erased, widened, other]).toHaveLength(3);
  });
});
