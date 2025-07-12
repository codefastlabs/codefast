import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base paths for the project
const PROJECT_ROOT = path.join(__dirname, "..");
const PACKAGES_PATH = path.join(PROJECT_ROOT, "packages");
const APPS_PATH = path.join(PROJECT_ROOT, "apps");

/**
 * Extract exports from a TypeScript/TSX file
 */
function extractExportsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const components = [];
    const types = [];

    // Match export statements with improved regex
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip comments and empty lines
      if (trimmedLine.startsWith("//") || trimmedLine.startsWith("/*") || !trimmedLine) {
        continue;
      }

      // Match export type { ... } statements
      const typeExportMatch = trimmedLine.match(/export\s+type\s+{\s*([^}]+)\s*}/);
      if (typeExportMatch) {
        const typeExports = typeExportMatch[1]
          .split(",")
          .map((exp) => exp.trim().split(" as ")[0].trim())
          .filter((exp) => exp && exp.length > 0);
        types.push(...typeExports);
        continue;
      }

      // Match export { ... } statements (components and non-type exports)
      const namedExportMatch = trimmedLine.match(/export\s+{\s*([^}]+)\s*}/);
      if (namedExportMatch) {
        const namedExports = namedExportMatch[1]
          .split(",")
          .map((exp) => exp.trim().split(" as ")[0].trim())
          .filter((exp) => exp && exp.length > 0);

        // Separate types from components based on naming convention
        for (const exp of namedExports) {
          if (exp.endsWith("Props") || exp.endsWith("Config") || exp.endsWith("Api")) {
            types.push(exp);
          } else {
            components.push(exp);
          }
        }
        continue;
      }

      // Match export const/function/class declarations (components)
      const componentMatch = trimmedLine.match(/export\s+(?:const|function|class)\s+(\w+)/);
      if (componentMatch) {
        components.push(componentMatch[1]);
        continue;
      }

      // Match export interface/type declarations (types)
      const typeMatch = trimmedLine.match(/export\s+(?:interface|type)\s+(\w+)/);
      if (typeMatch) {
        types.push(typeMatch[1]);
        continue;
      }

      // Match export default statements (we'll skip these for individual exports)
      if (trimmedLine.match(/export\s+default/)) {
      }
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
 * Find all index.ts files in the project
 */
function findAllIndexFiles() {
  const indexFiles = [];

  // Helper function to recursively find index.ts files
  function findIndexFilesInDir(dir, basePath = "") {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          // Skip node_modules and other irrelevant directories
          if (item === "node_modules" || item === ".git" || item === "dist" || item === "build") {
            continue;
          }
          findIndexFilesInDir(itemPath, basePath);
        } else if (item === "index.ts") {
          indexFiles.push(itemPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error.message);
    }
  }

  // Find index files in packages and apps
  if (fs.existsSync(PACKAGES_PATH)) {
    findIndexFilesInDir(PACKAGES_PATH);
  }
  if (fs.existsSync(APPS_PATH)) {
    findIndexFilesInDir(APPS_PATH);
  }

  return indexFiles;
}

/**
 * Extract export * statements from an index file
 */
function extractExportStarStatements(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const exportStars = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip comments and empty lines
      if (trimmedLine.startsWith("//") || trimmedLine.startsWith("/*") || !trimmedLine) {
        continue;
      }

      // Match export * from "..." statements
      const exportStarMatch = trimmedLine.match(/export\s+\*\s+from\s+["']([^"']+)["']/);
      if (exportStarMatch) {
        exportStars.push({
          statement: trimmedLine,
          modulePath: exportStarMatch[1],
        });
      }
    }

    return exportStars;
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Resolve module path to actual file path
 */
function resolveModulePath(modulePath, indexFilePath) {
  const indexDir = path.dirname(indexFilePath);

  // Handle @ alias paths
  if (modulePath.startsWith("@/")) {
    // Find the src directory relative to the index file
    let srcDir = indexDir;
    while (srcDir !== path.dirname(srcDir)) {
      if (path.basename(srcDir) === "src") {
        break;
      }
      srcDir = path.dirname(srcDir);
    }

    const relativePath = modulePath.replace("@/", "");
    const resolvedPath = path.join(srcDir, relativePath);

    // First try index files in directory (most common case for components)
    const extensions = [".ts", ".tsx", ".js", ".jsx"];
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, "index" + ext);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }

    // Then try direct file with extensions
    for (const ext of extensions) {
      const fullPath = resolvedPath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  // Handle relative paths
  if (modulePath.startsWith("./") || modulePath.startsWith("../")) {
    const resolvedPath = path.resolve(indexDir, modulePath);

    // First try index files in directory
    const extensions = [".ts", ".tsx", ".js", ".jsx"];
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, "index" + ext);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }

    // Then try direct file with extensions
    for (const ext of extensions) {
      const fullPath = resolvedPath + ext;
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  return null;
}

/**
 * Analyze a component directory and extract all exports
 */
function analyzeComponentDirectory(componentPath) {
  const exports = [];
  const files = fs.readdirSync(componentPath);

  for (const file of files) {
    if (file === "index.ts" || file === "index.tsx") continue; // Skip index files

    const filePath = path.join(componentPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && (file.endsWith(".ts") || file.endsWith(".tsx"))) {
      const fileExports = extractExportsFromFile(filePath);
      if (fileExports.components.length > 0 || fileExports.types.length > 0) {
        const relativePath = `@/components/${path.basename(componentPath)}/${file.replace(/\.(ts|tsx)$/, "")}`;
        exports.push({
          path: relativePath,
          components: fileExports.components,
          types: fileExports.types,
        });
      }
    }
  }

  return exports;
}

/**
 * Process a single index file to replace export * with individual exports
 */
function processIndexFile(indexFilePath) {
  console.log(`Processing ${path.relative(PROJECT_ROOT, indexFilePath)}...`);

  const exportStars = extractExportStarStatements(indexFilePath);

  if (exportStars.length === 0) {
    console.log(`  No export * statements found, skipping.`);
    return null;
  }

  const individualExports = [];
  let hasChanges = false;

  for (const exportStar of exportStars) {
    const resolvedPath = resolveModulePath(exportStar.modulePath, indexFilePath);

    if (!resolvedPath) {
      console.warn(`  Warning: Could not resolve module path "${exportStar.modulePath}"`);
      // Keep the original export * statement if we can't resolve it
      individualExports.push(exportStar.statement);
      continue;
    }

    const fileExports = extractExportsFromFile(resolvedPath);

    if (fileExports.components.length > 0 || fileExports.types.length > 0) {
      hasChanges = true;

      // Add individual component exports
      if (fileExports.components.length > 0) {
        individualExports.push(`export { ${fileExports.components.join(", ")} } from "${exportStar.modulePath}";`);
      }

      // Add individual type exports
      if (fileExports.types.length > 0) {
        individualExports.push(`export type { ${fileExports.types.join(", ")} } from "${exportStar.modulePath}";`);
      }
    } else {
      // Keep the original export * statement if no exports found
      individualExports.push(exportStar.statement);
    }
  }

  if (!hasChanges) {
    console.log(`  No changes needed.`);
    return null;
  }

  return {
    filePath: indexFilePath,
    originalExports: exportStars,
    individualExports: individualExports,
  };
}

/**
 * Generate individual exports for all index files
 */
function generateIndividualExports() {
  const indexFiles = findAllIndexFiles();
  const processedFiles = [];

  console.log(`Found ${indexFiles.length} index.ts files to analyze...`);

  for (const indexFile of indexFiles) {
    const result = processIndexFile(indexFile);
    if (result) {
      processedFiles.push(result);
    }
  }

  return processedFiles;
}

/**
 * Generate the new content for an index file
 */
function generateIndexContent(processedFile) {
  const originalContent = fs.readFileSync(processedFile.filePath, "utf-8");
  const lines = originalContent.split("\n");
  const newLines = [];

  // Track which export * statements we've replaced
  const replacedStatements = new Set(processedFile.originalExports.map((exp) => exp.statement));

  // Process each line
  for (const line of lines) {
    const trimmedLine = line.trim();

    // If this line is an export * statement that we're replacing, skip it
    if (replacedStatements.has(trimmedLine)) {
      continue;
    }

    // Keep all other lines (including comments, other exports, etc.)
    newLines.push(line);
  }

  // Add the individual exports at the end
  if (processedFile.individualExports.length > 0) {
    // Add the individual export statements
    for (const exportStatement of processedFile.individualExports) {
      newLines.push(exportStatement);
    }
  }

  // Remove leading empty lines to avoid creating empty lines at the beginning of the file
  while (newLines.length > 0 && newLines[0].trim() === "") {
    newLines.shift();
  }

  return newLines.join("\n");
}

/**
 * Main function
 */
function main() {
  console.log("🔍 Generating individual exports for all index.ts files...");

  try {
    // Process all index files
    const processedFiles = generateIndividualExports();

    if (processedFiles.length === 0) {
      console.log("✅ No index.ts files with export * statements found.");
      return;
    }

    console.log(`\n📝 Processing ${processedFiles.length} files with export * statements...`);

    let totalReplacements = 0;

    // Process each file
    for (const processedFile of processedFiles) {
      const relativePath = path.relative(PROJECT_ROOT, processedFile.filePath);
      console.log(`\n  Processing ${relativePath}...`);

      // Generate new content
      const newContent = generateIndexContent(processedFile);

      // Write new content
      fs.writeFileSync(processedFile.filePath, newContent);
      console.log(`    ✅ Updated with individual exports`);

      // Count replacements
      const replacements = processedFile.originalExports.length;
      totalReplacements += replacements;
      console.log(`    🔄 Replaced ${replacements} export * statement(s)`);
    }

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   - Files processed: ${processedFiles.length}`);
    console.log(`   - Total export * statements replaced: ${totalReplacements}`);

    console.log(`\n🎉 Successfully updated all index.ts files to use individual exports!`);
  } catch (error) {
    console.error("❌ Error generating exports:", error);
    process.exit(1);
  }
}

// Run the script
main();
