import { describe, expect, it } from "vitest";
import { Container } from "#lib/container";
import { ScopeViolationError } from "#lib/errors";
import { token } from "#lib/token";

class Ephemeral {
  readonly tag = "ephemeral";
}

const TShort = token<Ephemeral>("ShortLived");
const TLong = token<string>("LongLived");

describe("ScopeValidation", () => {
  it("throws from validate() when a singleton binding statically depends on a transient binding", () => {
    const container = Container.create();
    container
      .bind(TShort)
      .toDynamic(() => new Ephemeral())
      .transient();
    container
      .bind(TLong)
      .toResolved((shortLived) => `holds:${shortLived.tag}`, [TShort])
      .singleton();

    expect(() => {
      container.validate();
    }).toThrowError(ScopeViolationError);
  });

  it("throws during resolve when a singleton captures a transient dependency", () => {
    const container = Container.create();
    container
      .bind(TShort)
      .toDynamic(() => new Ephemeral())
      .transient();
    container
      .bind(TLong)
      .toResolved((shortLived) => `holds:${shortLived.tag}`, [TShort])
      .singleton();

    expect(() => {
      container.resolve(TLong);
    }).toThrowError(ScopeViolationError);
  });

  it("allows singleton depending on another singleton", () => {
    const container = Container.create();
    container
      .bind(TShort)
      .toDynamic(() => new Ephemeral())
      .singleton();
    container
      .bind(TLong)
      .toResolved((shortLived) => `holds:${shortLived.tag}`, [TShort])
      .singleton();
    container.validate();
    expect(container.resolve(TLong)).toBe("holds:ephemeral");
  });

  it("allows singleton depending on a constant binding", () => {
    const TConfig = token<string>("Config");
    const container = Container.create();
    container.bind(TConfig).toConstantValue("x");
    container
      .bind(TLong)
      .toResolved((config) => `holds:${config}`, [TConfig])
      .singleton();
    container.validate();
    expect(container.resolve(TLong)).toBe("holds:x");
  });
});
