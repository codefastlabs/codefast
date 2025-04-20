import fs from "node:fs";
import path from "node:path";

import { prompt } from "@/commands/create-project/utils";

/**
 * Validates the given project name against various criteria to ensure it is suitable for use.
 *
 * The validation checks include:
 * - Ensuring the name is not empty or comprised only of whitespace.
 * - Restricting the maximum length of the name to 100 characters.
 * - Enforcing URL-friendly naming conventions, prohibiting special characters such as `@` or names resembling scoped
 * packages.
 * - Preventing the use of prohibited project names such as '.' or '..'.
 * - Restricting the use of reserved system names on Windows.
 * - Ensuring that the specified project name does not conflict with an existing directory in the current working
 * directory.
 * - Verifying that the current directory has write permissions for the creation of a new project.
 *
 * @param name - The proposed project name to be validated.
 * @returns An object indicating whether the project name is valid. If invalid, an error message is provided.
 */
function validateProjectName(name: string): { valid: boolean; error?: string } {
  // Check if the name is empty or contains only spaces.
  if (!name || /^\s*$/.test(name)) {
    return { valid: false, error: "Project name cannot be empty or contain only whitespace." };
  }

  // Check the name length
  if (name.length > 100) {
    return { valid: false, error: "Project name is too long (maximum 100 characters)." };
  }

  // Check the package name format according to npm standard (scoped packages are not allowed).
  const npmNameRegex = /^[a-z0-9-~][a-z0-9-._~]*$/;

  if (!npmNameRegex.test(name)) {
    return {
      valid: false,
      error:
        "Project name must be URL-friendly (letters, numbers, hyphens, underscores, dots; no @ or scoped packages).",
    };
  }

  // Check if the name contains only dots.
  if (name === "." || name === "..") {
    return { valid: false, error: "Project name cannot be '.' or '..'." };
  }

  // Checking system keywords on Windows
  const reservedNames = /^(?<reserved>CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

  if (reservedNames.test(name)) {
    return { valid: false, error: `Project name "${name}" is a reserved system name.` };
  }

  // Check the existence of the directory
  const fullPath = path.resolve(process.cwd(), name);

  if (fs.existsSync(fullPath)) {
    return { valid: false, error: `A directory named "${name}" already exists.` };
  }

  // Check write permission
  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
  } catch {
    return { valid: false, error: "Cannot create project: No write permission in current directory." };
  }

  return { valid: true };
}

/**
 * Asynchronously prompts the user to enter a valid project name, validating the input and retrying up to a specified
 * number of attempts if necessary.
 *
 * @param initialName - An optional initial project name to validate; if not provided, the user will be prompted to
 *   enter a name.
 * @param attempts - The current number of validation attempts made. Defaults to 0.
 * @param maxAttempts - The maximum number of validation attempts allowed. Defaults to 3.
 * @returns A promise that resolves to a valid project name as a string.
 * @throws An error if the maximum number of validation attempts is exceeded.
 */
export async function getValidProjectName(initialName?: string, attempts = 0, maxAttempts = 3): Promise<string> {
  const projectName = initialName ?? (await prompt("Enter project name: "));

  const validation = validateProjectName(projectName);

  if (validation.valid) {
    return projectName;
  }

  if (attempts >= maxAttempts - 1) {
    throw new Error(`❌ Exceeded maximum attempts to enter a valid project name.`);
  }

  console.error(`❌ ${validation.error} (${maxAttempts - attempts - 1} attempts remaining)`);

  return getValidProjectName(undefined, attempts + 1, maxAttempts);
}
