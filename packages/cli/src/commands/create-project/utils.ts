import { execSync } from "node:child_process";
import fs from "node:fs";
import readline from "node:readline";

/**
 * Represents an interface for reading and writing data to the console or other input/output streams.
 *
 * This interface allows interaction with standard input and output streams by reading input and writing output
 * in a controlled manner. It is commonly used for creating command-line interfaces or handling user input.
 */
export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Asks a user a question and returns their response as a trimmed string.
 *
 * @param question - The question to present to the user.
 * @returns A promise that resolves with the user's response as a trimmed string.
 */
export function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Executes a shell command synchronously and inherits the output behavior of the current process.
 *
 * @param command - The shell command to be executed.
 * @returns void
 */
export function runCommand(command: string): void {
  execSync(command, { stdio: "inherit" });
}

/**
 * Writes configuration content to a specified file.
 *
 * @param filePath - The path of the file where the configuration content should be written.
 * @param content - The configuration content to write into the file.
 * @returns void
 */
export function writeConfigFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content);
  console.log(`📝 Created ${filePath}`);
}
