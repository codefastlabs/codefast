import path from "node:path";
import {
  extractImportSpecifiers,
  scanCliPackageArchitectureViolations,
  violationsForFileContent,
} from "#lib/core/application/architecture-boundaries.policy";

const cliPackageRoot = path.resolve(__dirname, "..", "..");

describe("architecture boundaries (CI guardrails)", () => {
  describe("import extraction", () => {
    it("collects static from / import() specifiers", () => {
      const src = `
        import a from "#lib/foo";
        import type { B } from "#lib/bar";
        import "#lib/side";
        void import("#lib/dyn");
      `;
      const specs = extractImportSpecifiers(src);
      expect(specs).toContain("#lib/foo");
      expect(specs).toContain("#lib/bar");
      expect(specs).toContain("#lib/side");
      expect(specs).toContain("#lib/dyn");
    });
  });

  describe("rule engine (deliberate forbidden imports)", () => {
    const arrangeDomainFile = path.join(cliPackageRoot, "src/lib/arrange/domain/hypothetical.ts");

    it("rejects domain importing #lib/infra (shared infra package)", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import { x } from "#lib/infra/node-io.adapter";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("rejects domain importing same-context application", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import { analyzeDirectory } from "#lib/arrange/application/use-cases/analyze-directory.use-case";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("rejects arrange/domain importing mirror/domain (cross-context)", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import type { X } from "#lib/mirror/domain/types.domain";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("rejects application importing infra (any bounded context)", () => {
      const appFile = path.join(cliPackageRoot, "src/lib/mirror/application/x.ts");
      const violations = violationsForFileContent(
        appFile,
        { context: "mirror", layer: "application" },
        `import type { CliFs } from "#lib/infra/fs-contract.port";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("allows domain importing core/kernel types", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import type { Result } from "#lib/core/domain/result.model";\n`,
      );
      expect(violations).toEqual([]);
    });

    it("allows product domain importing shared source-code domain", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import { applyEditsDescending } from "#lib/shared/source-code/domain/text-edit.model";\n`,
      );
      expect(violations).toEqual([]);
    });

    it("rejects shared source-code domain importing product context", () => {
      const sharedDomainFile = path.join(
        cliPackageRoot,
        "src/lib/shared/source-code/domain/hypothetical.ts",
      );
      const violations = violationsForFileContent(
        sharedDomainFile,
        { context: "shared-source-code", layer: "domain" },
        `import type { X } from "#lib/arrange/domain/types.domain";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("rejects application importing sibling product context", () => {
      const mirrorAppFile = path.join(cliPackageRoot, "src/lib/mirror/application/x.ts");
      const violations = violationsForFileContent(
        mirrorAppFile,
        { context: "mirror", layer: "application" },
        `import { groupFile } from "#lib/arrange/application/use-cases/group-file.use-case";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("Rule A: rejects *.model.ts importing a use-case module", () => {
      const modelFile = path.join(cliPackageRoot, "src/lib/core/domain/result.model.ts");
      const violations = violationsForFileContent(
        modelFile,
        { context: "core", layer: "domain" },
        `import { x } from "#lib/arrange/application/use-cases/group-file.use-case";\n`,
      );
      expect(violations.some((line) => line.includes("Rule A"))).toBe(true);
    });

    it("Rule A: rejects *.domain.ts importing an adapter module", () => {
      const domainFile = path.join(cliPackageRoot, "src/lib/arrange/domain/types.domain.ts");
      const violations = violationsForFileContent(
        domainFile,
        { context: "arrange", layer: "domain" },
        `import { x } from "#lib/arrange/infra/file-walker.adapter";\n`,
      );
      expect(violations.some((line) => line.includes("Rule A"))).toBe(true);
    });

    it("Rule B: rejects application importing a presenter", () => {
      const appFile = path.join(cliPackageRoot, "src/lib/arrange/application/x.ts");
      const violations = violationsForFileContent(
        appFile,
        { context: "arrange", layer: "application" },
        `import { p } from "#lib/core/presentation/cli-executor.presenter";\n`,
      );
      expect(violations.some((line) => line.includes("Rule B"))).toBe(true);
    });

    it("Rule C: rejects arrange infra importing mirror", () => {
      const infraFile = path.join(cliPackageRoot, "src/lib/arrange/infra/x.adapter.ts");
      const violations = violationsForFileContent(
        infraFile,
        { context: "arrange", layer: "infra" },
        `import type { X } from "#lib/mirror/domain/types.domain";\n`,
      );
      expect(violations.some((line) => line.includes("Rule C"))).toBe(true);
    });

    it("Rule C: allows arrange importing shared source-code", () => {
      const domainFile = path.join(cliPackageRoot, "src/lib/arrange/domain/x.domain.ts");
      const violations = violationsForFileContent(
        domainFile,
        { context: "arrange", layer: "domain" },
        `import { applyEditsDescending } from "#lib/shared/source-code/domain/text-edit.model";\n`,
      );
      expect(violations.some((line) => line.includes("Rule C"))).toBe(false);
    });
  });

  describe("live codebase scan", () => {
    it("has zero boundary violations under src/lib (non-test sources only)", () => {
      const violations = scanCliPackageArchitectureViolations(cliPackageRoot);
      expect(violations).toEqual([]);
    });
  });
});
