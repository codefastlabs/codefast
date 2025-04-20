import fs from "node:fs";
import path from "node:path";

import { getValidProjectName } from "@/commands/create-project/project-name";
import { prompt } from "@/commands/create-project/utils";

/**
 * Checks if a package.json file exists in the current directory and determines the project name.
 * If package.json exists, it prompts the user to confirm continuing with the existing project
 * and retrieves the project name from package.json or the provided argument.
 * If package.json does not exist, it validates the provided project name or prompts for a new one.
 *
 * @param projectNameArg - Optional project name provided as an argument.
 * @returns A promise that resolves to an object containing the project name and a boolean indicating if package.json
 *   exists.
 * @throws An error if the user aborts the operation or if the project name cannot be determined.
 */
export async function checkExistingProject(
  projectNameArg?: string,
): Promise<{ packageJsonExists: boolean; projectName: string }> {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJsonExists = fs.existsSync(packageJsonPath);

  if (packageJsonExists) {
    console.log(`⚠️ A package.json file has been detected in the current directory.`);
    const confirm = await prompt("Do you want to continue configuring this existing project? [Y/n]: ");

    // Default to 'Y' if the input is empty; otherwise, check for 'y' or 'Y'
    if (confirm === "" || confirm.toLowerCase() === "y") {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      const projectName = packageJson.name ?? (await getValidProjectName(projectNameArg));

      return { projectName, packageJsonExists };
    }

    console.log("Aborting...");
    throw new Error("User aborted the operation.");
  }

  const projectName = await getValidProjectName(projectNameArg);

  return { projectName, packageJsonExists };
}
