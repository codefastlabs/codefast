import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { inject } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import { postConstruct, preDestroy } from "#/decorators/lifecycle-decorators";
import { InternalError, MissingContainerContextError } from "#/errors/errors";
import { defaultMetadataReader } from "#/metadata/symbol-metadata-reader";

const integrationDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(integrationDir, "..", "..");

describe("Stage 3 decorators — metadata & lifecycle", () => {
  it("registers accessor metadata via @injectable + getAccessorMetadata", () => {
    const MetadataDepToken = token<string>("decorators.meta");
    const container = Container.create();
    container.bind(MetadataDepToken).toConstantValue("ok");

    @injectable([])
    class AccessorMetadataProbe {
      @inject(MetadataDepToken) accessor value!: string;
    }

    container.bind(AccessorMetadataProbe).toSelf().transient();
    const accessorMetadata = defaultMetadataReader.getAccessorMetadata(AccessorMetadataProbe);
    expect(accessorMetadata?.length).toBe(1);
    expect(accessorMetadata?.[0]?.descriptor.token).toBe(MetadataDepToken);
  });

  it("names the class, not the accessor, when there is no container context", () => {
    const ContextDepToken = token<string>("decorators.no-context");

    @injectable([])
    class ContextlessProbe {
      @inject(ContextDepToken) accessor value!: string;
    }

    let caught: unknown;

    try {
      new ContextlessProbe();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(MissingContainerContextError);
    // The class and the accessor stay separate, so the message can name each for what it is.
    expect((caught as MissingContainerContextError).className).toBe("ContextlessProbe");
    expect((caught as MissingContainerContextError).accessorName).toBe("value");
    expect((caught as MissingContainerContextError).message).toContain("Class 'ContextlessProbe'");
    expect((caught as MissingContainerContextError).message).toContain("@inject accessor 'value'");
  });

  it("reports no class when the instance reaches no constructor", () => {
    const ContextDepToken = token<string>("decorators.no-constructor");

    @injectable([])
    class UnreachableConstructorProbe {
      @inject(ContextDepToken) accessor value!: string;
    }

    // The only way to have no class name to report: nothing on the chain answers `constructor`.
    Reflect.deleteProperty(UnreachableConstructorProbe.prototype, "constructor");
    Object.setPrototypeOf(UnreachableConstructorProbe.prototype, null);

    let caught: unknown;

    try {
      new UnreachableConstructorProbe();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(MissingContainerContextError);
    expect((caught as MissingContainerContextError).className).toBeUndefined();
    expect((caught as MissingContainerContextError).accessorName).toBe("value");
    // No class to name, so the message must not invent one.
    expect((caught as MissingContainerContextError).message).not.toContain("Class");
  });

  it("rejects @postConstruct on static method at class evaluation time", () => {
    expect(() => {
      class StaticPostConstructTarget {
        @postConstruct()
        static init(): void {}
      }
      void StaticPostConstructTarget;
    }).toThrow(InternalError);
  });

  it("rejects @preDestroy on static method at class evaluation time", () => {
    expect(() => {
      class StaticPreDestroyTarget {
        @preDestroy()
        static cleanup(): void {}
      }
      void StaticPreDestroyTarget;
    }).toThrow(InternalError);
  });
});

describe("Accessor injection e2e (tsx subprocess)", () => {
  it("constructor → accessor inject → @postConstruct with tsx emit", () => {
    const scriptPath = join(integrationDir, "support", "accessor-e2e.script.ts");
    const spawnResult = spawnSync("node", ["--import", "tsx/esm", scriptPath], {
      cwd: packageRoot,
      encoding: "utf-8",
    });
    expect(spawnResult.status).toBe(0);
    expect(spawnResult.stdout).toContain("ACCESSOR_E2E_OK");
  });
});
