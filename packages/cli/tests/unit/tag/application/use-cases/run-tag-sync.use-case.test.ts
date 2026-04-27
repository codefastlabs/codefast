import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { isOk } from "#/lib/core/domain/result.model";
import { NodeCliPathAdapter } from "#/lib/core/infrastructure/path.adapter";
import type { TagTargetCandidate } from "#/lib/tag/domain/types.domain";
import { RunTagSyncUseCaseImpl } from "#/lib/tag/application/use-cases/run-tag-sync.use-case";
import type { TagSinceWriterPort } from "#/lib/tag/application/ports/tag-since-writer.port";
import type { TagTargetResolverPort } from "#/lib/tag/application/ports/target-resolver.port";
import type { TypeScriptTreeWalkPort } from "#/lib/tag/application/ports/typescript-tree-walk.port";
import type { TagVersionResolverPort } from "#/lib/tag/application/ports/tag-version-resolver.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";

type TagSyncUseCaseDeps = {
  fs: CliFs;
  path: CliPath;
  targetResolver: TagTargetResolverPort;
  typeScriptTreeWalk: TypeScriptTreeWalkPort;
  versionResolver: TagVersionResolverPort;
  sinceWriter: TagSinceWriterPort;
};

const mockVersionResolver: TagSyncUseCaseDeps["versionResolver"] = {
  resolveNearestPackageVersion: vi.fn(() => "1.0.0"),
};

const mockSinceWriter: TagSyncUseCaseDeps["sinceWriter"] = {
  applySinceTagsToFile: vi.fn((filePath: string, _version: string, _write: boolean) => ({
    filePath,
    taggedDeclarations: 1,
    changed: true,
  })),
};

const testCliPath = new NodeCliPathAdapter();

function toPosix(filePath: string): string {
  return filePath.split("\\").join("/");
}

function createSubject(deps: TagSyncUseCaseDeps): RunTagSyncUseCaseImpl {
  return new RunTagSyncUseCaseImpl(
    deps.fs,
    deps.path,
    deps.targetResolver,
    deps.typeScriptTreeWalk,
    deps.versionResolver,
    deps.sinceWriter,
  );
}

describe("runTagSync use case", () => {
  it("returns ok with no targets when resolver yields no candidates", async () => {
    const deps: TagSyncUseCaseDeps = {
      fs: {
        existsSync: vi.fn(),
        statSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
      } as unknown as CliFs,
      targetResolver: {
        resolveTagTargetCandidates: vi.fn(async () => []),
      },
      typeScriptTreeWalk: {
        walkTsxFiles: vi.fn(),
      },
      path: testCliPath,
      versionResolver: mockVersionResolver,
      sinceWriter: mockSinceWriter,
    };
    const outcome = await createSubject(deps).execute({
      rootDir: "/repo",
      write: false,
    });
    expect(isOk(outcome)).toBe(true);
    if (!isOk(outcome)) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.filesScanned).toBe(0);
    expect(outcome.value.selectedTargets).toEqual([]);
  });

  it("returns INFRA_FAILURE when resolver throws", async () => {
    const deps: TagSyncUseCaseDeps = {
      fs: {} as CliFs,
      targetResolver: {
        resolveTagTargetCandidates: vi.fn(async () => {
          throw new Error("resolver boom");
        }),
      },
      typeScriptTreeWalk: { walkTsxFiles: vi.fn() },
      path: testCliPath,
      versionResolver: mockVersionResolver,
      sinceWriter: mockSinceWriter,
    };
    const outcome = await createSubject(deps).execute({ rootDir: "/repo", write: false });
    expect(isOk(outcome)).toBe(false);
    if (isOk(outcome)) {
      throw new Error("expected failure outcome");
    }
    expect(outcome.error.code).toBe("INFRA_FAILURE");
  });

  it("skips packages named in skipPackages", async () => {
    const candidate: TagTargetCandidate = {
      candidatePath: "/repo/packages/a",
      rootRelativeCandidatePath: "packages/a",
      source: "workspace-package",
      packageDir: "/repo/packages/a",
      packageName: "pkg-a",
    };
    const deps: TagSyncUseCaseDeps = {
      fs: {
        existsSync: vi.fn(() => false),
        statSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
      } as unknown as CliFs,
      targetResolver: {
        resolveTagTargetCandidates: vi.fn(async () => [candidate]),
      },
      typeScriptTreeWalk: { walkTsxFiles: vi.fn() },
      path: testCliPath,
      versionResolver: mockVersionResolver,
      sinceWriter: mockSinceWriter,
    };
    const outcome = await createSubject(deps).execute({
      rootDir: "/repo",
      write: false,
      skipPackages: ["pkg-a"],
    });
    expect(isOk(outcome)).toBe(true);
    if (!isOk(outcome)) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.skippedPackages).toEqual(["pkg-a"]);
    expect(outcome.value.selectedTargets).toEqual([]);
  });

  it("selects workspace package src/ when present", async () => {
    const candidate: TagTargetCandidate = {
      candidatePath: "/repo/packages/a",
      rootRelativeCandidatePath: "packages/a",
      source: "workspace-package",
      packageDir: "/repo/packages/a",
      packageName: "pkg-a",
    };
    const deps: TagSyncUseCaseDeps = {
      fs: {
        existsSync: vi.fn((p: string) => {
          const n = toPosix(p);
          return n.endsWith("/packages/a/src") || n.endsWith("/packages/a/package.json");
        }),
        statSync: vi.fn((p: string) => {
          const n = toPosix(p);
          return {
            isDirectory: () => n.endsWith("/packages/a/src") || n.endsWith("/packages/a"),
          };
        }),
        readFileSync: vi.fn((p: string) => {
          if (toPosix(p).endsWith("/packages/a/package.json")) {
            return JSON.stringify({ version: "9.9.9" });
          }
          return "";
        }),
        writeFileSync: vi.fn(),
      } as unknown as CliFs,
      targetResolver: {
        resolveTagTargetCandidates: vi.fn(async () => [candidate]),
      },
      typeScriptTreeWalk: { walkTsxFiles: vi.fn(() => []) },
      path: testCliPath,
      versionResolver: mockVersionResolver,
      sinceWriter: mockSinceWriter,
    };
    const outcome = await createSubject(deps).execute({ rootDir: "/repo", write: false });
    expect(isOk(outcome)).toBe(true);
    if (!isOk(outcome)) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.selectedTargets[0]?.targetPath).toBe("/repo/packages/a/src");
    expect(outcome.value.selectedTargets[0]?.source).toBe("workspace-package-selected-src");
  });

  it("falls back to package root when src/ is absent", async () => {
    const candidate: TagTargetCandidate = {
      candidatePath: "/repo/packages/a",
      rootRelativeCandidatePath: "packages/a",
      source: "workspace-package",
      packageDir: "/repo/packages/a",
      packageName: "pkg-a",
    };
    const deps: TagSyncUseCaseDeps = {
      fs: {
        existsSync: vi.fn((p: string) => toPosix(p).endsWith("/packages/a/package.json")),
        statSync: vi.fn((p: string) => ({
          isDirectory: () => toPosix(p).endsWith("/packages/a"),
        })),
        readFileSync: vi.fn((p: string) => {
          if (toPosix(p).endsWith("/packages/a/package.json")) {
            return JSON.stringify({ version: "1.0.0" });
          }
          return "";
        }),
        writeFileSync: vi.fn(),
      } as unknown as CliFs,
      targetResolver: {
        resolveTagTargetCandidates: vi.fn(async () => [candidate]),
      },
      typeScriptTreeWalk: { walkTsxFiles: vi.fn(() => []) },
      path: testCliPath,
      versionResolver: mockVersionResolver,
      sinceWriter: mockSinceWriter,
    };
    const outcome = await createSubject(deps).execute({ rootDir: "/repo", write: false });
    expect(isOk(outcome)).toBe(true);
    if (!isOk(outcome)) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.selectedTargets[0]?.targetPath).toBe("/repo/packages/a");
    expect(outcome.value.selectedTargets[0]?.source).toBe("workspace-package-selected-root");
  });

  it("records missing targets without scanning files", async () => {
    const candidate: TagTargetCandidate = {
      candidatePath: "/repo/missing",
      rootRelativeCandidatePath: "missing",
      source: "explicit-target",
      packageDir: null,
      packageName: null,
    };
    const deps: TagSyncUseCaseDeps = {
      fs: {
        existsSync: vi.fn(() => false),
        statSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
      } as unknown as CliFs,
      targetResolver: {
        resolveTagTargetCandidates: vi.fn(async () => [candidate]),
      },
      typeScriptTreeWalk: { walkTsxFiles: vi.fn() },
      path: testCliPath,
      versionResolver: mockVersionResolver,
      sinceWriter: mockSinceWriter,
    };
    const outcome = await createSubject(deps).execute({ rootDir: "/repo", write: false });
    expect(isOk(outcome)).toBe(true);
    if (!isOk(outcome)) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.targetResults[0]?.targetExists).toBe(false);
    expect(outcome.value.targetResults[0]?.runError).toContain("Not found");
    expect(outcome.value.filesScanned).toBe(0);
  });

  it("reports mixed versions when targets resolve different package versions", async () => {
    const candidateA: TagTargetCandidate = {
      candidatePath: "/repo/a",
      rootRelativeCandidatePath: "a",
      source: "explicit-target",
      packageDir: null,
      packageName: null,
    };
    const candidateB: TagTargetCandidate = {
      candidatePath: "/repo/b",
      rootRelativeCandidatePath: "b",
      source: "explicit-target",
      packageDir: null,
      packageName: null,
    };
    const deps: TagSyncUseCaseDeps = {
      fs: {
        existsSync: vi.fn((p: string) => {
          const n = toPosix(p);
          return (
            n === "/repo/a" ||
            n === "/repo/b" ||
            n.endsWith("/a/package.json") ||
            n.endsWith("/b/package.json")
          );
        }),
        statSync: vi.fn((p: string) => {
          const n = toPosix(p);
          return { isDirectory: () => n === "/repo/a" || n === "/repo/b" };
        }),
        readFileSync: vi.fn((p: string) => {
          const n = toPosix(p);
          if (n.endsWith("/a/package.json")) {
            return JSON.stringify({ version: "1.0.0" });
          }
          if (n.endsWith("/b/package.json")) {
            return JSON.stringify({ version: "2.0.0" });
          }
          return "";
        }),
        writeFileSync: vi.fn(),
      } as unknown as CliFs,
      targetResolver: {
        resolveTagTargetCandidates: vi.fn(async () => [candidateA, candidateB]),
      },
      typeScriptTreeWalk: { walkTsxFiles: vi.fn(() => []) },
      path: testCliPath,
      versionResolver: {
        resolveNearestPackageVersion: vi.fn((targetPath: string) =>
          toPosix(targetPath).includes("/repo/a") ? "1.0.0" : "2.0.0",
        ),
      },
      sinceWriter: mockSinceWriter,
    };
    const outcome = await createSubject(deps).execute({ rootDir: "/repo", write: false });
    expect(isOk(outcome)).toBe(true);
    if (!isOk(outcome)) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.versionSummary).toBe("mixed");
    expect(outcome.value.distinctVersions).toEqual(["1.0.0", "2.0.0"]);
  });

  it("surfaces onAfterWrite hook failures without failing the sync result", async () => {
    const candidate: TagTargetCandidate = {
      candidatePath: "/repo/pkg",
      rootRelativeCandidatePath: "pkg",
      source: "explicit-target",
      packageDir: null,
      packageName: null,
    };
    const taggedSource = `export function HookTarget() { return 1; }\n`;
    const deps: TagSyncUseCaseDeps = {
      fs: {
        existsSync: vi.fn((p: string) => {
          const n = toPosix(p);
          return n === "/repo/pkg" || n.endsWith("/pkg/package.json") || n.endsWith("/pkg/x.ts");
        }),
        statSync: vi.fn((p: string) => {
          const n = toPosix(p);
          if (n === "/repo/pkg") {
            return { isDirectory: () => true };
          }
          return { isDirectory: () => false };
        }),
        readFileSync: vi.fn((p: string) => {
          const n = toPosix(p);
          if (n.endsWith("/pkg/package.json")) {
            return JSON.stringify({ version: "3.0.0" });
          }
          if (n.endsWith("/pkg/x.ts")) {
            return taggedSource;
          }
          return "";
        }),
        writeFileSync: vi.fn(),
      } as unknown as CliFs,
      targetResolver: {
        resolveTagTargetCandidates: vi.fn(async () => [candidate]),
      },
      typeScriptTreeWalk: {
        walkTsxFiles: vi.fn((root: string) => [`${toPosix(root)}/x.ts`]),
      },
      path: testCliPath,
      versionResolver: mockVersionResolver,
      sinceWriter: mockSinceWriter,
    };
    const outcome = await createSubject(deps).execute({
      rootDir: "/repo",
      write: true,
      config: {
        onAfterWrite: vi.fn(async () => {
          throw new Error("hook failed");
        }),
      },
    });
    expect(isOk(outcome)).toBe(true);
    if (!isOk(outcome)) {
      throw new Error("expected ok outcome");
    }
    expect(outcome.value.hookError).toContain("onAfterWrite hook failed");
  });
});
