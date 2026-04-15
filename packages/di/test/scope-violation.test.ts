import { describe, expect, it } from "vitest";
import { Container, ScopeViolationError, token } from "../src/index";

class Ephemeral {
  readonly tag = "ephemeral";
}

const TShort = token<Ephemeral>("ShortLived");
const TLong = token<string>("LongLived");

describe("ScopeViolationError", () => {
  it("throws from validate() when a singleton binding statically depends on a transient binding", () => {
    const container = Container.create();
    container
      .bind(TShort)
      .toDynamic(() => new Ephemeral())
      .transient()
      .build();
    container
      .bind(TLong)
      .toResolved((shortLived) => `holds:${shortLived.tag}`, [TShort])
      .singleton()
      .build();

    expect(() => {
      container.validate();
    }).toThrowError(ScopeViolationError);
  });

  it("throws during resolve when a singleton captures a transient dependency", () => {
    const container = Container.create();
    container
      .bind(TShort)
      .toDynamic(() => new Ephemeral())
      .transient()
      .build();
    container
      .bind(TLong)
      .toResolved((shortLived) => `holds:${shortLived.tag}`, [TShort])
      .singleton()
      .build();

    expect(() => {
      container.resolve(TLong);
    }).toThrowError(ScopeViolationError);
  });

  it("allows singleton depending on another singleton", () => {
    const container = Container.create();
    container
      .bind(TShort)
      .toDynamic(() => new Ephemeral())
      .singleton()
      .build();
    container
      .bind(TLong)
      .toResolved((shortLived) => `holds:${shortLived.tag}`, [TShort])
      .singleton()
      .build();
    container.validate();
    expect(container.resolve(TLong)).toBe("holds:ephemeral");
  });

  it("allows singleton depending on a constant binding even when the constant uses transient scope", () => {
    const TConfig = token<string>("Config");
    const container = Container.create();
    container.bind(TConfig).toConstantValue("x").transient().build();
    container
      .bind(TLong)
      .toResolved((config) => `holds:${config}`, [TConfig])
      .singleton()
      .build();
    container.validate();
    expect(container.resolve(TLong)).toBe("holds:x");
  });
});
