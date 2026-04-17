import {
  extractImportSpecifiers,
  scanCliPackageArchitectureViolations,
  violationsForFileContent,
} from "#/lib/core/application/architecture-boundaries.policy";
import { createNodeCliFs } from "#/lib/infra/node-io.adapter";
import { nodeCliPath } from "#/lib/core/infra/path.adapter";

const cliPackageRoot = nodeCliPath.resolve(__dirname, "..", "..", "..", "..");

describe("architecture boundaries (CI guardrails)", () => {
  describe("import extraction", () => {
    it("collects static from / import() specifiers", () => {
      const src = `
        import a from "#/lib/foo";
        import type { B } from "#/lib/bar";
        import "#lib/side";
        void import("#/lib/dyn");
      `;
      const specs = extractImportSpecifiers(src);
      expect(specs).toContain("#lib/foo");
      expect(specs).toContain("#lib/bar");
      expect(specs).toContain("#lib/side");
      expect(specs).toContain("#lib/dyn");
    });
  });

  describe("rule engine (deliberate forbidden imports)", () => {
    const arrangeDomainFile = nodeCliPath.join(
      cliPackageRoot,
      "src/lib/arrange/domain/hypothetical.ts",
    );

    it("rejects domain importing #lib/infra (shared infra package)", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import { x } from "#/lib/infra/node-io.adapter";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("rejects domain importing same-context application", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import { analyzeDirectory } from "#/lib/arrange/application/use-cases/analyze-directory.use-case";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("rejects arrange/domain importing mirror/domain (cross-context)", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import type { X } from "#/lib/mirror/domain/types.domain";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("rejects application importing infra (any bounded context)", () => {
      const appFile = nodeCliPath.join(cliPackageRoot, "src/lib/mirror/application/x.ts");
      const violations = violationsForFileContent(
        appFile,
        { context: "mirror", layer: "application" },
        `import type { CliFs } from "#/lib/infra/fs-contract.port";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("allows domain importing core/kernel types", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import type { Result } from "#/lib/core/domain/result.model";\n`,
      );
      expect(violations).toEqual([]);
    });
  });

  describe("live codebase scan", () => {
    it("has zero boundary violations under src/lib (non-test sources only)", () => {
      const violations = scanCliPackageArchitectureViolations(
        cliPackageRoot,
        createNodeCliFs(),
        nodeCliPath,
      );
      expect(violations).toEqual([]);
    });
  });
});
