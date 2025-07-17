import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base paths for the project
const PROJECT_ROOT = path.join(__dirname, "..");
const PACKAGES_PATH = path.join(PROJECT_ROOT, "packages");

/**
 * Extract exports from a TypeScript/TSX file
 */
function extractExportsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const components = [];
    const types = [];

    // Remove comments and normalize whitespace for better parsing
    const cleanContent = content
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
      .replace(/\/\/.*$/gm, "") // Remove line comments
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Match export type { ... } statements (multi-line support)
    const typeExportRegex = /export\s+type\s*{\s*([^}]+)\s*}/g;
    let typeMatch;
    while ((typeMatch = typeExportRegex.exec(cleanContent)) !== null) {
      const typeExports = typeMatch[1]
        .split(",")
        .map((exp) => exp.trim().split(" as ")[0].trim())
        .filter((exp) => exp && exp.length > 0);
      types.push(...typeExports);
    }

    // Match export { ... } statements (multi-line support)
    const namedExportRegex = /export\s*{\s*([^}]+)\s*}/g;
    let namedMatch;
    while ((namedMatch = namedExportRegex.exec(cleanContent)) !== null) {
      const namedExports = namedMatch[1]
        .split(",")
        .map((exp) => exp.trim())
        .filter((exp) => exp && exp.length > 0);

      // Process each export, handling aliases properly
      for (const exp of namedExports) {
        const parts = exp.split(" as ");
        const originalName = parts[0].trim();
        const aliasName = parts[1] ? parts[1].trim() : null;

        // Determine if it's a type based on naming convention
        const isType = originalName.endsWith("Props") || originalName.endsWith("Type");

        if (isType) {
          types.push(originalName);
          if (aliasName) {
            types.push(aliasName);
          }
        } else {
          components.push(originalName);
          if (aliasName) {
            components.push(aliasName);
          }
        }
      }
    }

    // Match export const/function/class declarations (components)
    const componentRegex = /export\s+(?:const|function|class)\s+(\w+)/g;
    let componentMatch;
    while ((componentMatch = componentRegex.exec(cleanContent)) !== null) {
      components.push(componentMatch[1]);
    }

    // Match export interface/type declarations (types)
    const typeDeclarationRegex = /export\s+(?:interface|type)\s+(\w+)/g;
    let typeDeclarationMatch;
    while ((typeDeclarationMatch = typeDeclarationRegex.exec(cleanContent)) !== null) {
      types.push(typeDeclarationMatch[1]);
    }

    return {
      components: [...new Set(components.filter((exp) => exp && exp.length > 0))],
      types: [...new Set(types.filter((exp) => exp && exp.length > 0))],
    };
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message);
    return { components: [], types: [] };
  }
}

/**
 * Find all component directories and their actual component files
 */
function findComponentFiles(componentsDir) {
  const componentFiles = [];

  if (!fs.existsSync(componentsDir)) {
    return componentFiles;
  }

  const items = fs.readdirSync(componentsDir);

  for (const item of items) {
    const itemPath = path.join(componentsDir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Look for actual component files in this directory
      const dirItems = fs.readdirSync(itemPath);

      for (const dirItem of dirItems) {
        // Skip index files - we want to go directly to component files
        if (dirItem === "index.ts" || dirItem === "index.tsx") {
          continue;
        }

        if (dirItem.endsWith(".tsx") || dirItem.endsWith(".ts")) {
          const filePath = path.join(itemPath, dirItem);

          // Extract exports from this file
          const exports = extractExportsFromFile(filePath);

          if (exports.components.length > 0 || exports.types.length > 0) {
            // Create relative path from components directory
            const relativePath = path.join(item, dirItem.replace(/\.(tsx?|jsx?)$/, ""));

            componentFiles.push({
              componentName: item,
              filePath: filePath,
              relativePath: relativePath,
              exports: exports
            });
          }
        }
      }
    }
  }

  return componentFiles;
}

/**
 * Generate new main index.ts content that exports directly from component files
 */
function generateMainIndexContent(componentFiles, libExports = []) {
  const lines = [];

  // Group exports by component directory
  const exportsByComponent = {};

  for (const file of componentFiles) {
    if (!exportsByComponent[file.componentName]) {
      exportsByComponent[file.componentName] = {
        components: [],
        types: [],
        files: []
      };
    }

    exportsByComponent[file.componentName].components.push(...file.exports.components);
    exportsByComponent[file.componentName].types.push(...file.exports.types);
    exportsByComponent[file.componentName].files.push(file);
  }

  // Generate export statements for each component
  const componentNames = Object.keys(exportsByComponent).sort();

  for (const componentName of componentNames) {
    const componentData = exportsByComponent[componentName];

    // Deduplicate exports
    const uniqueComponents = [...new Set(componentData.components)];
    const uniqueTypes = [...new Set(componentData.types)];

    // For each file in this component directory, create export statements
    for (const file of componentData.files) {
      const fromPath = `@/components/${file.relativePath}`;

      if (file.exports.components.length > 0) {
        lines.push(`export { ${file.exports.components.join(", ")} } from "${fromPath}";`);
      }

      if (file.exports.types.length > 0) {
        lines.push(`export type { ${file.exports.types.join(", ")} } from "${fromPath}";`);
      }
    }

    // Add blank line between components for readability
    lines.push("");
  }

  // Add lib exports at the end
  if (libExports.length > 0) {
    for (const libExport of libExports) {
      lines.push(libExport);
    }
  }

  // Remove trailing empty lines
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}

/**
 * Remove intermediate index files
 */
function removeIntermediateIndexFiles(uiSrcPath) {
  const filesToRemove = [];

  // Remove components/index.ts
  const componentsIndexPath = path.join(uiSrcPath, "components", "index.ts");
  if (fs.existsSync(componentsIndexPath)) {
    filesToRemove.push(componentsIndexPath);
  }

  // Remove all component-level index files
  const componentsDir = path.join(uiSrcPath, "components");
  if (fs.existsSync(componentsDir)) {
    const items = fs.readdirSync(componentsDir);

    for (const item of items) {
      const itemPath = path.join(componentsDir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        const indexPath = path.join(itemPath, "index.ts");
        if (fs.existsSync(indexPath)) {
          filesToRemove.push(indexPath);
        }
      }
    }
  }

  // Remove the files
  let removedCount = 0;
  for (const filePath of filesToRemove) {
    try {
      fs.unlinkSync(filePath);
      console.log(`    ✅ Removed ${path.relative(PROJECT_ROOT, filePath)}`);
      removedCount++;
    } catch (error) {
      console.warn(`    ⚠️  Could not remove ${path.relative(PROJECT_ROOT, filePath)}: ${error.message}`);
    }
  }

  return removedCount;
}

/**
 * Fix internal component imports in all component files
 */
function fixInternalComponentImports(componentsDir, componentFiles) {
  // Create a mapping of component directory names to their actual files
  const componentMapping = {};

  for (const file of componentFiles) {
    if (!componentMapping[file.componentName]) {
      componentMapping[file.componentName] = [];
    }
    componentMapping[file.componentName].push(file);
  }

  // Create a mapping of specific exports to their source files
  const exportToFileMapping = {};

  for (const file of componentFiles) {
    // Add all exports from this file to the mapping
    for (const exportName of file.exports.components) {
      if (!exportToFileMapping[exportName]) {
        exportToFileMapping[exportName] = [];
      }
      exportToFileMapping[exportName].push(file);
    }

    for (const exportName of file.exports.types) {
      if (!exportToFileMapping[exportName]) {
        exportToFileMapping[exportName] = [];
      }
      exportToFileMapping[exportName].push(file);
    }
  }

  let totalFixedImports = 0;

  // Process each component file to fix imports
  for (const file of componentFiles) {
    const content = fs.readFileSync(file.filePath, "utf-8");
    let newContent = content;
    let hasChanges = false;

    // Find all import statements that reference @/components/[componentName]
    const importStatementRegex = /import\s*{([^}]+)}\s*from\s*["']@\/components\/([^"'\/]+)["']/g;
    let match;

    while ((match = importStatementRegex.exec(content)) !== null) {
      const importedItems = match[1];
      const importedComponentName = match[2];

      // Skip if this component doesn't exist in our mapping
      if (!componentMapping[importedComponentName]) {
        continue;
      }

      // Parse the imported items
      const imports = importedItems
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      // Group imports by their source files
      const importsByFile = {};

      for (const importItem of imports) {
        // Handle "as" aliases
        const cleanImportName = importItem.split(' as ')[0].trim();

        // Find which file exports this item
        let targetFile = null;

        if (exportToFileMapping[cleanImportName]) {
          // Find the file in the same component directory
          const candidateFiles = exportToFileMapping[cleanImportName].filter(f =>
            f.componentName === importedComponentName
          );

          if (candidateFiles.length > 0) {
            targetFile = candidateFiles[0];
          }
        }

        // If we can't find the specific export, fall back to the main component file
        if (!targetFile) {
          const componentFiles = componentMapping[importedComponentName];
          targetFile = componentFiles.find(f =>
            path.basename(f.filePath, path.extname(f.filePath)) === importedComponentName
          );

          // If no exact match, take the first file (fallback)
          if (!targetFile) {
            targetFile = componentFiles[0];
          }
        }

        if (targetFile) {
          const targetPath = `@/components/${targetFile.relativePath}`;

          if (!importsByFile[targetPath]) {
            importsByFile[targetPath] = [];
          }
          importsByFile[targetPath].push(importItem);
        }
      }

      // Replace the original import with new imports grouped by file
      if (Object.keys(importsByFile).length > 0) {
        const oldImportStatement = match[0];
        const newImportStatements = [];

        for (const [filePath, imports] of Object.entries(importsByFile)) {
          newImportStatements.push(`import { ${imports.join(', ')} } from "${filePath}";`);
        }

        newContent = newContent.replace(oldImportStatement, newImportStatements.join('\n'));
        hasChanges = true;
        totalFixedImports++;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(file.filePath, newContent);
      console.log(`    ✅ Fixed imports in ${path.relative(PROJECT_ROOT, file.filePath)}`);
    }
  }

  return totalFixedImports;
}

/**
 * Process UI package to eliminate intermediate index files
 */
function processUIPackage() {
  const uiPackagePath = path.join(PACKAGES_PATH, "ui");
  const uiSrcPath = path.join(uiPackagePath, "src");
  const mainIndexPath = path.join(uiSrcPath, "index.ts");

  if (!fs.existsSync(uiSrcPath)) {
    console.log("❌ UI package src directory not found");
    return;
  }

  console.log("🔍 Processing UI package for tree-shaking optimization...");

  // Step 1: Find all component files
  const componentsDir = path.join(uiSrcPath, "components");
  const componentFiles = findComponentFiles(componentsDir);

  console.log(`📁 Found ${componentFiles.length} component files`);

  // Step 2: Extract lib exports (preserve existing lib exports)
  const libExports = [];
  if (fs.existsSync(mainIndexPath)) {
    const currentContent = fs.readFileSync(mainIndexPath, "utf-8");
    const lines = currentContent.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes("@/lib") || trimmedLine.includes("VariantProps")) {
        libExports.push(trimmedLine);
      }
    }
  }

  // Step 3: Fix internal component imports
  console.log("\n🔧 Fixing internal component imports...");
  const fixedImports = fixInternalComponentImports(componentsDir, componentFiles);
  console.log(`    📊 Fixed ${fixedImports} internal imports`);

  // Step 4: Generate new main index content
  const newMainIndexContent = generateMainIndexContent(componentFiles, libExports);

  // Step 5: Remove intermediate index files
  console.log("\n🗑️  Removing intermediate index files...");
  const removedCount = removeIntermediateIndexFiles(uiSrcPath);
  console.log(`    📊 Removed ${removedCount} intermediate index files`);

  // Step 6: Update main index.ts
  console.log("\n📝 Updating main index.ts...");
  fs.writeFileSync(mainIndexPath, newMainIndexContent);
  console.log(`    ✅ Updated ${path.relative(PROJECT_ROOT, mainIndexPath)}`);

  // Step 7: Summary
  console.log(`\n🎉 Tree-shaking optimization complete!`);
  console.log(`   - Component files processed: ${componentFiles.length}`);
  console.log(`   - Internal imports fixed: ${fixedImports}`);
  console.log(`   - Intermediate index files removed: ${removedCount}`);
  console.log(`   - Main index.ts updated with direct exports`);
}

/**
 * Main function
 */
function main() {
  console.log("🌳 Optimizing UI package for better tree-shaking...");

  try {
    processUIPackage();
    console.log("\n✅ Tree-shaking optimization completed successfully!");
  } catch (error) {
    console.error("❌ Error during tree-shaking optimization:", error);
    process.exit(1);
  }
}

// Run the script
main();
