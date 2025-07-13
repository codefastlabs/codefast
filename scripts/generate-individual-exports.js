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
 * Find all subdirectories in a given directory that don't have index files
 */
function findSubdirectoriesWithoutIndex(parentDir) {
  const subdirectoriesWithoutIndex = [];

  try {
    if (!fs.existsSync(parentDir)) {
      return subdirectoriesWithoutIndex;
    }

    const items = fs.readdirSync(parentDir);

    for (const item of items) {
      const itemPath = path.join(parentDir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (item === "node_modules" || item === ".git" || item === "dist" || item === "build") {
          continue;
        }

        // Check if this directory has an index.ts or index.tsx file
        const hasIndexTs = fs.existsSync(path.join(itemPath, "index.ts"));
        const hasIndexTsx = fs.existsSync(path.join(itemPath, "index.tsx"));

        if (!hasIndexTs && !hasIndexTsx) {
          // Check if this directory has any TypeScript/TSX files that could be exported
          const hasExportableFiles = fs.readdirSync(itemPath).some((file) => {
            return file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js") || file.endsWith(".jsx");
          });

          // Also check if this directory has subdirectories with index files (intermediate layer case)
          const hasSubdirectoriesWithIndex = fs.readdirSync(itemPath).some((subItem) => {
            const subItemPath = path.join(itemPath, subItem);
            try {
              const subStat = fs.statSync(subItemPath);
              if (subStat.isDirectory()) {
                return (
                  fs.existsSync(path.join(subItemPath, "index.ts")) ||
                  fs.existsSync(path.join(subItemPath, "index.tsx"))
                );
              }
            } catch (error) {
              return false;
            }
            return false;
          });

          if (hasExportableFiles || hasSubdirectoriesWithIndex) {
            subdirectoriesWithoutIndex.push(itemPath);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${parentDir}:`, error.message);
  }

  return subdirectoriesWithoutIndex;
}

/**
 * Create index.ts file for a subdirectory by analyzing its files
 */
function createIndexFileForSubdirectory(subdirPath) {
  try {
    const files = fs.readdirSync(subdirPath);
    const exports = { components: [], types: [] };
    const indexContent = [];

    // First, check if this directory has subdirectories with index files (intermediate layer case)
    const subdirectoriesWithIndex = [];

    for (const item of files) {
      const itemPath = path.join(subdirPath, item);
      try {
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          const hasIndexTs = fs.existsSync(path.join(itemPath, "index.ts"));
          const hasIndexTsx = fs.existsSync(path.join(itemPath, "index.tsx"));

          if (hasIndexTs || hasIndexTsx) {
            const indexPath = hasIndexTs ? path.join(itemPath, "index.ts") : path.join(itemPath, "index.tsx");
            const subExports = extractExportsFromFile(indexPath);

            if (subExports.components.length > 0 || subExports.types.length > 0) {
              subdirectoriesWithIndex.push({
                name: item,
                exports: subExports,
              });
            }
          }
        }
      } catch (error) {
        // Skip items that can't be processed
      }
    }

    // If we found subdirectories with index files, create exports for them
    if (subdirectoriesWithIndex.length > 0) {
      for (const subdir of subdirectoriesWithIndex) {
        if (subdir.exports.components.length > 0) {
          indexContent.push(`export { ${subdir.exports.components.join(", ")} } from "./${subdir.name}";`);
        }

        if (subdir.exports.types.length > 0) {
          indexContent.push(`export type { ${subdir.exports.types.join(", ")} } from "./${subdir.name}";`);
        }
      }
    } else {
      // Fallback to the original logic for files in the directory
      // Analyze each file in the subdirectory
      for (const file of files) {
        if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js") || file.endsWith(".jsx")) {
          if (file !== "index.ts" && file !== "index.tsx") {
            const filePath = path.join(subdirPath, file);
            const fileExports = extractExportsFromFile(filePath);
            exports.components.push(...fileExports.components);
            exports.types.push(...fileExports.types);
          }
        }
      }

      // Remove duplicates
      exports.components = [...new Set(exports.components)];
      exports.types = [...new Set(exports.types)];

      if (exports.components.length === 0 && exports.types.length === 0) {
        return false;
      }

      // Find the main file (usually the one with the same name as the directory)
      const dirName = path.basename(subdirPath);
      const mainFile = files.find((file) => {
        const baseName = file.replace(/\.(ts|tsx|js|jsx)$/, "");
        return baseName === dirName || baseName === dirName.replace(/-/g, "");
      });

      if (mainFile) {
        const mainFileBase = mainFile.replace(/\.(ts|tsx|js|jsx)$/, "");

        // Export from the main file
        if (exports.components.length > 0) {
          indexContent.push(`export { ${exports.components.join(", ")} } from "./${mainFileBase}";`);
        }

        if (exports.types.length > 0) {
          indexContent.push(`export type { ${exports.types.join(", ")} } from "./${mainFileBase}";`);
        }
      } else {
        // If no main file found, export from all files
        const processedFiles = new Set();

        for (const file of files) {
          if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js") || file.endsWith(".jsx")) {
            if (file !== "index.ts" && file !== "index.tsx" && !processedFiles.has(file)) {
              const filePath = path.join(subdirPath, file);
              const fileExports = extractExportsFromFile(filePath);

              if (fileExports.components.length > 0 || fileExports.types.length > 0) {
                const fileBase = file.replace(/\.(ts|tsx|js|jsx)$/, "");

                if (fileExports.components.length > 0) {
                  indexContent.push(`export { ${fileExports.components.join(", ")} } from "./${fileBase}";`);
                }

                if (fileExports.types.length > 0) {
                  indexContent.push(`export type { ${fileExports.types.join(", ")} } from "./${fileBase}";`);
                }

                processedFiles.add(file);
              }
            }
          }
        }
      }
    }

    if (indexContent.length > 0) {
      const indexPath = path.join(subdirPath, "index.ts");
      fs.writeFileSync(indexPath, indexContent.join("\n") + "\n");
      console.log(`  ✅ Created ${path.relative(PROJECT_ROOT, indexPath)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.warn(`Warning: Could not create index file for ${subdirPath}:`, error.message);
    return false;
  }
}

/**
 * Create missing index files for subdirectories in packages
 */
function createMissingIndexFiles() {
  console.log("🔍 Creating missing index files for subdirectories...");

  let totalCreated = 0;

  // Process each package
  const packages = fs.readdirSync(PACKAGES_PATH).filter((item) => {
    const itemPath = path.join(PACKAGES_PATH, item);
    return fs.statSync(itemPath).isDirectory();
  });

  for (const packageName of packages) {
    const packagePath = path.join(PACKAGES_PATH, packageName);
    const srcPath = path.join(packagePath, "src");

    if (!fs.existsSync(srcPath)) {
      continue;
    }

    console.log(`\n📦 Processing package: ${packageName}`);

    // Find all subdirectories in src that might need index files
    function processDirectory(dirPath) {
      const subdirs = findSubdirectoriesWithoutIndex(dirPath);

      for (const subdir of subdirs) {
        const created = createIndexFileForSubdirectory(subdir);
        if (created) {
          totalCreated++;
        }
      }

      // Also check subdirectories recursively
      try {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);

          if (stat.isDirectory() && item !== "node_modules" && item !== ".git" && item !== "dist" && item !== "build") {
            processDirectory(itemPath);
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not process directory ${dirPath}:`, error.message);
      }
    }

    processDirectory(srcPath);
  }

  console.log(`\n📊 Created ${totalCreated} missing index files`);
  return totalCreated;
}

/**
 * Update parent index files to use intermediate index files
 */
function updateParentIndexFiles() {
  console.log("🔍 Updating parent index files to use intermediate index files...");

  let totalUpdated = 0;

  // Process each package
  const packages = fs.readdirSync(PACKAGES_PATH).filter((item) => {
    const itemPath = path.join(PACKAGES_PATH, item);
    return fs.statSync(itemPath).isDirectory();
  });

  for (const packageName of packages) {
    const packagePath = path.join(PACKAGES_PATH, packageName);
    const srcPath = path.join(packagePath, "src");
    const mainIndexPath = path.join(srcPath, "index.ts");

    if (!fs.existsSync(mainIndexPath)) {
      continue;
    }

    console.log(`\n📦 Processing package: ${packageName}`);

    // Check if there are intermediate index files that can be used
    const intermediateIndexFiles = [];

    function findIntermediateIndexFiles(dirPath, relativePath = "") {
      try {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);

          if (stat.isDirectory() && item !== "node_modules" && item !== ".git" && item !== "dist" && item !== "build") {
            const indexPath = path.join(itemPath, "index.ts");
            const indexTsxPath = path.join(itemPath, "index.tsx");

            if (fs.existsSync(indexPath) || fs.existsSync(indexTsxPath)) {
              const relativeDir = relativePath ? `${relativePath}/${item}` : item;
              intermediateIndexFiles.push({
                directory: item,
                relativePath: relativeDir,
                indexPath: fs.existsSync(indexPath) ? indexPath : indexTsxPath,
              });
            }

            // Recursively check subdirectories
            const newRelativePath = relativePath ? `${relativePath}/${item}` : item;
            findIntermediateIndexFiles(itemPath, newRelativePath);
          }
        }
      } catch (error) {
        console.warn(`Warning: Could not read directory ${dirPath}:`, error.message);
      }
    }

    findIntermediateIndexFiles(srcPath);

    if (intermediateIndexFiles.length > 0) {
      console.log(`  Found ${intermediateIndexFiles.length} intermediate index files`);

      // Read the current main index content
      const currentContent = fs.readFileSync(mainIndexPath, "utf-8");
      let newContent = currentContent;
      let hasChanges = false;

      // For each intermediate index file, check if we can consolidate exports
      for (const intermediate of intermediateIndexFiles) {
        const exports = extractExportsFromFile(intermediate.indexPath);

        if (exports.components.length > 0 || exports.types.length > 0) {
          // Create the new export statements
          const newExportStatements = [];

          if (exports.components.length > 0) {
            newExportStatements.push(
              `export { ${exports.components.join(", ")} } from "@/${intermediate.relativePath}";`,
            );
          }

          if (exports.types.length > 0) {
            newExportStatements.push(
              `export type { ${exports.types.join(", ")} } from "@/${intermediate.relativePath}";`,
            );
          }

          // Replace individual component exports with consolidated exports
          const componentPattern = new RegExp(
            `export\\s*{[^}]*}\\s*from\\s*["']@/${intermediate.relativePath}/[^"']*["'];?\\s*\\n?` +
              `(export\\s*type\\s*{[^}]*}\\s*from\\s*["']@/${intermediate.relativePath}/[^"']*["'];?\\s*\\n?)?`,
            "gm",
          );

          // Also a match type exports separately
          const typePattern = new RegExp(
            `export\\s*type\\s*{[^}]*}\\s*from\\s*["']@/${intermediate.relativePath}/[^"']*["'];?\\s*\\n?`,
            "gm",
          );

          // Check if there are existing exports from this intermediate path
          const hasExistingExports = componentPattern.test(currentContent) || typePattern.test(currentContent);

          if (hasExistingExports) {
            // Replace existing exports with consolidated ones
            newContent = newContent.replace(componentPattern, "");
            newContent = newContent.replace(typePattern, "");

            // Add the new consolidated exports
            const insertPoint = newContent.lastIndexOf("\n") + 1;
            newContent = newContent.slice(0, insertPoint) + "\n" + newExportStatements.join("\n") + "\n";

            hasChanges = true;
            console.log(`    ✅ Consolidated exports for ${intermediate.relativePath}`);
          }
        }
      }

      if (hasChanges) {
        // Clean up excessive newlines
        newContent = newContent.replace(/\n{3,}/g, "\n\n");
        fs.writeFileSync(mainIndexPath, newContent);
        totalUpdated++;
        console.log(`    ✅ Updated ${path.relative(PROJECT_ROOT, mainIndexPath)}`);
      }
    }
  }

  console.log(`\n📊 Updated ${totalUpdated} parent index files`);
  return totalUpdated;
}

/**
 * Main function
 */
function main() {
  console.log("🔍 Generating individual exports for all index.ts files...");

  try {
    // Step 1: Create missing index files for subdirectories
    console.log("\n=== STEP 1: Creating Missing Index Files ===");
    const createdFiles = createMissingIndexFiles();

    // Step 2: Update parent index files to use intermediate index files
    console.log("\n=== STEP 2: Updating Parent Index Files ===");
    const updatedParentFiles = updateParentIndexFiles();

    // Step 3: Process remaining export * statements
    console.log("\n=== STEP 3: Processing Export * Statements ===");

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
    console.log(`   - Missing index files created: ${createdFiles}`);
    console.log(`   - Parent index files updated: ${updatedParentFiles}`);
    console.log(`   - Export * processing passes: ${passNumber - 1}`);
    console.log(`   - Files processed for export *: ${totalFilesProcessed}`);
    console.log(`   - Export * statements replaced: ${totalReplacements}`);

    console.log(`\n🎉 Successfully updated all index.ts files with intermediate layers and individual exports!`);
  } catch (error) {
    console.error("❌ Error generating exports:", error);
    process.exit(1);
  }
}

// Run the script
main();
