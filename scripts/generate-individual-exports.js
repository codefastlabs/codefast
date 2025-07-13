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
        const isType =
          originalName.endsWith("Props") || originalName.endsWith("Config") || originalName.endsWith("Api");

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

    // First, try index files in the directory (the most common case for components)
    const extensions = [".ts", ".tsx", ".js", ".jsx"];
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, "index" + ext);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }

    // Then try a direct file with extensions
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

    // First, try index files in the directory
    const extensions = [".ts", ".tsx", ".js", ".jsx"];
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, "index" + ext);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }

    // Then try a direct file with extensions
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
      individualExports.push({
        modulePath: exportStar.modulePath,
        statements: [exportStar.statement],
      });
      continue;
    }

    const fileExports = extractExportsFromFile(resolvedPath);

    if (fileExports.components.length > 0 || fileExports.types.length > 0) {
      hasChanges = true;

      const statements = [];

      // Add individual component exports
      if (fileExports.components.length > 0) {
        statements.push(`export { ${fileExports.components.join(", ")} } from "${exportStar.modulePath}";`);
      }

      // Add individual type exports
      if (fileExports.types.length > 0) {
        statements.push(`export type { ${fileExports.types.join(", ")} } from "${exportStar.modulePath}";`);
      }

      individualExports.push({
        modulePath: exportStar.modulePath,
        statements: statements,
      });
    } else {
      // Keep the original export * statement if no exports found
      individualExports.push({
        modulePath: exportStar.modulePath,
        statements: [exportStar.statement],
      });
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
 * Sort index files by depth (deepest first) to ensure nested index files are processed before parent index files
 */
function sortIndexFilesByDepth(indexFiles) {
  return indexFiles.sort((a, b) => {
    // Count path segments to determine depth
    const depthA = a.split(path.sep).length;
    const depthB = b.split(path.sep).length;

    // Sort by depth descending (deepest first)
    return depthB - depthA;
  });
}

/**
 * Generate individual exports for all index files
 */
function generateIndividualExports() {
  const indexFiles = findAllIndexFiles();

  // Sort index files by depth (deepest first) to process nested files before parent files
  const sortedIndexFiles = sortIndexFilesByDepth(indexFiles);

  const processedFiles = [];

  console.log(`Found ${indexFiles.length} index.ts files to analyze...`);
  console.log(`Processing files in depth-first order (nested files first)...`);

  for (const indexFile of sortedIndexFiles) {
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

  // Remove leading empty lines
  while (newLines.length > 0 && newLines[0].trim() === "") {
    newLines.shift();
  }

  // Remove trailing empty lines
  while (newLines.length > 0 && newLines[newLines.length - 1].trim() === "") {
    newLines.pop();
  }

  // Clean up excessive consecutive empty lines (limit to max 1 consecutive empty line)
  const cleanedLines = [];
  let consecutiveEmptyLines = 0;

  for (const line of newLines) {
    if (line.trim() === "") {
      consecutiveEmptyLines++;
      // Only allow 1 consecutive empty line
      if (consecutiveEmptyLines <= 1) {
        cleanedLines.push(line);
      }
    } else {
      consecutiveEmptyLines = 0;
      cleanedLines.push(line);
    }
  }

  // Add the individual exports at the end
  if (processedFile.individualExports.length > 0) {
    // Add a blank line before exports if there's existing content
    if (cleanedLines.length > 0) {
      cleanedLines.push("");
    }

    // Add the individual export statements with blank lines between different modules
    for (let i = 0; i < processedFile.individualExports.length; i++) {
      const exportGroup = processedFile.individualExports[i];

      // Add a blank line before each module group (except the first one)
      if (i > 0) {
        cleanedLines.push("");
      }

      // Add all statements for this module
      for (const statement of exportGroup.statements) {
        cleanedLines.push(statement);
      }
    }
  }

  return cleanedLines.join("\n");
}

/**
 * Main function
 */
function main() {
  console.log("🔍 Generating individual exports for all index.ts files...");

  try {
    let totalReplacements = 0;
    let totalFilesProcessed = 0;
    let passNumber = 1;
    let hasChanges = true;

    // Run multiple passes until no more changes are made
    while (hasChanges) {
      console.log(`\n🔄 Pass ${passNumber}: Processing export * statements...`);

      // Process all index files
      const processedFiles = generateIndividualExports();

      if (processedFiles.length === 0) {
        if (passNumber === 1) {
          console.log("✅ No index.ts files with export * statements found.");
          return;
        } else {
          console.log(`✅ No more export * statements to process in pass ${passNumber}.`);
          hasChanges = false;
          break;
        }
      }

      console.log(`\n📝 Processing ${processedFiles.length} files with export * statements...`);

      let passReplacements = 0;

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
        passReplacements += replacements;
        console.log(`    🔄 Replaced ${replacements} export * statement(s)`);
      }

      totalReplacements += passReplacements;
      totalFilesProcessed += processedFiles.length;

      console.log(`\n📊 Pass ${passNumber} Summary:`);
      console.log(`   - Files processed: ${processedFiles.length}`);
      console.log(`   - Export * statements replaced: ${passReplacements}`);

      passNumber++;

      // Safety check to prevent infinite loops
      if (passNumber > 10) {
        console.warn("⚠️  Reached maximum number of passes (10). Stopping to prevent infinite loop.");
        break;
      }
    }

    // Final summary
    console.log(`\n🎉 Final Summary:`);
    console.log(`   - Total passes: ${passNumber - 1}`);
    console.log(`   - Total files processed: ${totalFilesProcessed}`);
    console.log(`   - Total export * statements replaced: ${totalReplacements}`);

    console.log(`\n🎉 Successfully updated all index.ts files to use individual exports!`);
  } catch (error) {
    console.error("❌ Error generating exports:", error);
    process.exit(1);
  }
}

// Run the script
main();
