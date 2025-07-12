import fs from "fs";
import path from "path";

const componentsDir = "packages/ui/src/components";

function checkComponentTypes() {
  const components = fs.readdirSync(componentsDir);
  const results = [];

  components.forEach((componentName) => {
    const componentPath = path.join(componentsDir, componentName);
    const stats = fs.statSync(componentPath);

    if (stats.isDirectory()) {
      // Check for a main component file
      const possibleFiles = [
        path.join(componentPath, `${componentName}.tsx`),
        path.join(componentPath, "index.tsx"),
        path.join(componentPath, "index.ts"),
      ];

      let mainFile = null;
      for (const file of possibleFiles) {
        if (fs.existsSync(file)) {
          mainFile = file;
          break;
        }
      }

      if (mainFile) {
        const content = fs.readFileSync(mainFile, "utf8");

        // Extract exported components from export { ... } statements
        const exportComponentMatches = content.match(/export\s*\{\s*([^}]+)\s*\}/g) || [];
        const exportedComponents = [];
        exportComponentMatches.forEach((match) => {
          const componentsInExport = match.replace(/export\s*\{\s*/, "").replace(/\s*\}/, "");
          const components = componentsInExport
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c);
          exportedComponents.push(...components);
        });

        // Extract exported types from an export type { ... } statements
        const exportTypeMatches = content.match(/export\s+type\s*\{\s*([^}]+)\s*\}/g) || [];
        const exportedTypes = [];
        exportTypeMatches.forEach((match) => {
          const typesInExport = match.replace(/export\s+type\s*\{\s*/, "").replace(/\s*\}/, "");
          const types = typesInExport
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
          exportedTypes.push(...types);
        });

        // Filter out non-component exports (hooks, utils, etc.)
        const isComponent = (exportName) => {
          // Exclude hooks (functions starting with "use")
          if (exportName.startsWith("use")) {
            return false;
          }

          // Exclude utility functions like createCarouselScope, createFormFieldScope, etc.
          if (exportName.startsWith("create") && exportName.endsWith("Scope")) {
            return false;
          }

          // Exclude constants (all uppercase with underscores)
          if (exportName.match(/^[A-Z][A-Z_]*$/)) {
            return false;
          }

          // Exclude other common utility patterns
          if (exportName.startsWith("create") && !exportName.match(/^[A-Z]/)) {
            return false;
          }

          // Include only capitalized names that look like React components (PascalCase)
          return exportName.match(/^[A-Z][a-zA-Z0-9]*$/);
        };

        // Filter exported components to only include actual React components
        const actualComponents = exportedComponents.filter(isComponent);

        // Check correspondence between exported components and types
        const componentTypeCorrespondence = [];
        const missingTypeExports = [];
        const falsePositiveTypeExports = [];

        actualComponents.forEach((component) => {
          const expectedTypeName = `${component}Props`;
          const hasCorrespondingType = exportedTypes.includes(expectedTypeName);
          componentTypeCorrespondence.push({
            component,
            expectedType: expectedTypeName,
            hasCorrespondingType,
          });

          if (!hasCorrespondingType) {
            missingTypeExports.push({ component, expectedType: expectedTypeName });
          }
        });

        // Check for false positive type exports (types exported without corresponding component exports)
        exportedTypes.forEach((typeName) => {
          if (typeName.endsWith("Props")) {
            const expectedComponentName = typeName.replace(/Props$/, "");
            const hasCorrespondingComponent = actualComponents.includes(expectedComponentName);
            if (!hasCorrespondingComponent) {
              falsePositiveTypeExports.push({
                typeName,
                expectedComponent: expectedComponentName,
              });
            }
          }
        });


        results.push({
          component: componentName,
          file: mainFile,
          exportedComponents,
          actualComponents,
          exportedTypes,
          componentTypeCorrespondence,
          missingTypeExports,
          falsePositiveTypeExports,
          hasCorrespondenceIssues: missingTypeExports.length > 0 && actualComponents.length > 0,
          hasFalsePositiveTypes: falsePositiveTypeExports.length > 0,
        });
      }
    }
  });

  console.log("Component Type Analysis:");
  console.log("========================");

  // Component-Type Correspondence Analysis
  const componentsWithCorrespondenceIssues = results.filter((r) => r.hasCorrespondenceIssues);
  const componentsWithProperCorrespondence = results.filter(
    (r) => !r.hasCorrespondenceIssues && r.exportedComponents.length > 0,
  );
  const componentsWithFalsePositiveTypes = results.filter((r) => r.hasFalsePositiveTypes);

  console.log(`\nComponent-Type Correspondence Analysis:`);
  console.log("--------------------------------------");

  console.log(`\nComponents with proper type correspondence (${componentsWithProperCorrespondence.length}):`);
  console.log("-----------------------------------------------------------");
  componentsWithProperCorrespondence.forEach((result) => {
    console.log(`✓ ${result.component}`);
    if (result.actualComponents.length > 0) {
      console.log(`  Components (filtered): ${result.actualComponents.join(", ")}`);
      console.log(`  Exported types: ${result.exportedTypes.join(", ")}`);
      if (result.exportedComponents.length !== result.actualComponents.length) {
        const filtered = result.exportedComponents.filter((c) => !result.actualComponents.includes(c));
        console.log(`  Filtered out (non-components): ${filtered.join(", ")}`);
      }
    }
    console.log("");
  });

  console.log(`\nComponents with correspondence issues (${componentsWithCorrespondenceIssues.length}):`);
  console.log("----------------------------------------------------");
  componentsWithCorrespondenceIssues.forEach((result) => {
    console.log(`✗ ${result.component}: ${result.file}`);
    console.log(`  Components (filtered): ${result.actualComponents.join(", ") || "None"}`);
    console.log(`  Exported types: ${result.exportedTypes.join(", ") || "None"}`);

    if (result.exportedComponents.length !== result.actualComponents.length) {
      const filtered = result.exportedComponents.filter((c) => !result.actualComponents.includes(c));
      console.log(`  Filtered out (non-components): ${filtered.join(", ")}`);
    }

    if (result.missingTypeExports.length > 0) {
      console.log(`  Missing type exports:`);
      result.missingTypeExports.forEach((missing) => {
        console.log(`    - ${missing.component} → ${missing.expectedType}`);
      });
    }

    result.componentTypeCorrespondence.forEach((corr) => {
      const status = corr.hasCorrespondingType ? "✓" : "✗";
      console.log(`  ${status} ${corr.component} → ${corr.expectedType}`);
    });
    console.log("");
  });

  console.log(`\nComponents with false positive type exports (${componentsWithFalsePositiveTypes.length}):`);
  console.log("-------------------------------------------------------");
  componentsWithFalsePositiveTypes.forEach((result) => {
    console.log(`⚠ ${result.component}: ${result.file}`);
    console.log(`  Components (filtered): ${result.actualComponents.join(", ") || "None"}`);
    console.log(`  Exported types: ${result.exportedTypes.join(", ") || "None"}`);

    if (result.falsePositiveTypeExports.length > 0) {
      console.log(`  False positive type exports (types without corresponding component exports):`);
      result.falsePositiveTypeExports.forEach((falsePositive) => {
        console.log(`    - ${falsePositive.typeName} (expected component: ${falsePositive.expectedComponent})`);
      });
    }
    console.log("");
  });

  console.log(`\nSummary:`);
  console.log("--------");
  console.log(`Total components: ${results.length}`);
  console.log(`Components with proper correspondence: ${componentsWithProperCorrespondence.length}`);
  console.log(`Components with correspondence issues: ${componentsWithCorrespondenceIssues.length}`);
  console.log(`Components with false positive type exports: ${componentsWithFalsePositiveTypes.length}`);

  return results;
}

checkComponentTypes();
