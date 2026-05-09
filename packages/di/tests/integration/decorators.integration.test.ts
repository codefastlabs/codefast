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
    const Dep = token<string>("decorators.meta");
    const container = Container.create();
    container.bind(Dep).toConstantValue("ok");

    @injectable([])
    class MetaProbe {
      @inject(Dep) accessor s!: string;
    }

    container.bind(MetaProbe).toSelf().transient();
    const meta = defaultMetadataReader.getAccessorMetadata(MetaProbe);
    expect(meta?.length).toBe(1);
    expect(meta?.[0]?.descriptor.token).toBe(Dep);
  });

  it("rejects @postConstruct on static method at class evaluation time", () => {
    expect(() => {
      class Bad {
        @postConstruct()
        static init(): void {}
      }
      void Bad;
    }).toThrow(InternalError);
  });

  it("rejects @preDestroy on static method at class evaluation time", () => {
    expect(() => {
      class Bad {
        @preDestroy()
        static cleanup(): void {}
      }
      void Bad;
    }).toThrow(InternalError);
  });
});

describe("Accessor injection e2e (tsx subprocess)", () => {
  it("constructor → accessor inject → @postConstruct with tsx emit", () => {
    const script = join(integrationDir, "accessor-e2e.script.ts");
    const result = spawnSync("pnpm", ["exec", "tsx", script], {
      cwd: packageRoot,
      encoding: "utf-8",
    });
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("ACCESSOR_E2E_OK");
  });
});
