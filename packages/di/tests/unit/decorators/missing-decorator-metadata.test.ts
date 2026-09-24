/**
 * A transpiler compiles decorators to hand `context.metadata` as `undefined` on a runtime without
 * `Symbol.metadata` — TypeScript does so — and every decorator reports that as a named error with the
 * fix, rather than failing on the first property write.
 */
import { describe, expect, it } from "vitest";

import { token } from "#core/token";
import { inject } from "#decorators/inject";
import { injectable } from "#decorators/injectable";
import { postConstruct, preDestroy } from "#decorators/lifecycle-decorators";
import { MissingDecoratorMetadataError } from "#errors/errors";

const logger = token<string>("mdm:Logger");

/** The context shape a metadata-less transpile hands every decorator. */
function contextWithoutMetadata<Context>(fields: Record<string, unknown>): Context {
  return { metadata: undefined, addInitializer: () => {}, ...fields } as Context;
}

function thrownBy(run: () => void): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("a decorator given no metadata object", () => {
  it.each([
    [
      "injectable",
      () => injectable([])(undefined as never, contextWithoutMetadata({ kind: "class", name: "Service" })),
    ],
    [
      "inject",
      () =>
        inject(logger)(
          undefined as never,
          contextWithoutMetadata({ kind: "accessor", name: "logger", static: false, private: false }),
        ),
    ],
    [
      "postConstruct",
      () =>
        postConstruct()(
          undefined,
          contextWithoutMetadata({ kind: "method", name: "init", static: false, private: false }),
        ),
    ],
    [
      "preDestroy",
      () =>
        preDestroy()(
          undefined,
          contextWithoutMetadata({ kind: "method", name: "close", static: false, private: false }),
        ),
    ],
  ])("@%s throws MissingDecoratorMetadataError naming itself and the fix", (decoratorName, apply) => {
    const error = thrownBy(apply);

    expect(error).toBeInstanceOf(MissingDecoratorMetadataError);
    expect(error).toMatchObject({ code: "MISSING_DECORATOR_METADATA", decoratorName });
    expect((error as Error).message).toContain(
      '(Symbol as { metadata?: symbol }).metadata ??= Symbol.for("Symbol.metadata")',
    );
  });
});
