import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { Container } from "#/container";
import { inject } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import { postConstruct, preDestroy } from "#/decorators/lifecycle-decorators";
import { InternalError } from "#/errors";
import { defaultMetadataReader } from "#/metadata/symbol-metadata-reader";
import { token } from "#/token";

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
    const scriptPath = join(integrationDir, "accessor-e2e.script.ts");
    const spawnResult = spawnSync("pnpm", ["exec", "tsx", scriptPath], {
      cwd: packageRoot,
      encoding: "utf-8",
    });
    expect(spawnResult.stderr).toBe("");
    expect(spawnResult.status).toBe(0);
    expect(spawnResult.stdout).toContain("ACCESSOR_E2E_OK");
  });
});
