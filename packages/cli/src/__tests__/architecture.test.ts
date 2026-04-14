import path from "node:path";
import {
  extractImportSpecifiers,
  scanCliPackageArchitectureViolations,
  violationsForFileContent,
} from "#lib/core/application/architecture-boundaries";

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
        `import { x } from "#lib/infra/node-io";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("rejects domain importing same-context application", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import { analyzeDirectory } from "#lib/arrange/application/analyze";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("rejects arrange/domain importing mirror/domain (cross-context)", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import type { X } from "#lib/mirror/domain/types";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("rejects application importing infra (any bounded context)", () => {
      const appFile = path.join(cliPackageRoot, "src/lib/mirror/application/x.ts");
      const violations = violationsForFileContent(
        appFile,
        { context: "mirror", layer: "application" },
        `import type { CliFs } from "#lib/infra/fs-contract";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("allows domain importing core/kernel types", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import type { Result } from "#lib/core/domain/result";\n`,
      );
      expect(violations).toEqual([]);
    });

    it("allows product domain importing shared source-code domain", () => {
      const violations = violationsForFileContent(
        arrangeDomainFile,
        { context: "arrange", layer: "domain" },
        `import { applyEditsDescending } from "#lib/shared/source-code/domain/text-edit";\n`,
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
        `import type { X } from "#lib/arrange/domain/types";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it("rejects application importing sibling product context", () => {
      const mirrorAppFile = path.join(cliPackageRoot, "src/lib/mirror/application/x.ts");
      const violations = violationsForFileContent(
        mirrorAppFile,
        { context: "mirror", layer: "application" },
        `import { groupFile } from "#lib/arrange/application/group-file";\n`,
      );
      expect(violations.length).toBeGreaterThan(0);
    });
  });

  describe("live codebase scan", () => {
    it("has zero boundary violations under src/lib (non-test sources only)", () => {
      const violations = scanCliPackageArchitectureViolations(cliPackageRoot);
      expect(violations).toEqual([]);
    });
  });
});
