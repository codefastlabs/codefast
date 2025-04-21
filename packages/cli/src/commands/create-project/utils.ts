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
 * File operation and validation utilities for configuration management
 */
export const FileUtils = {
  /**
   * Checks if a file exists at the specified path
   */
  exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  },

  /**
   * Reads a file's content with error handling
   */
  readFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, "utf8");
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Writes content to a file with error handling
   */
  writeFile(filePath: string, content: string): void {
    try {
      fs.writeFileSync(filePath, content);
    } catch (error) {
      throw new Error(`Failed to write to file ${filePath}: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Writes configuration content to a specified file.
   *
   * @param filePath - The path of the file where the configuration content should be written.
   * @param content - The configuration content to write into the file.
   * @returns void
   */
  writeConfigFile(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content);
    console.log(`📝 Created ${filePath}`);
  },

  /**
   * Validates a file path and logs appropriate warning if not found
   * @returns true if a file exists, false otherwise
   */
  validatePath(filePath: string, filename: string): boolean {
    if (!this.exists(filePath)) {
      console.warn(`⚠️ ${filename} not found, skipping update.`);

      return false;
    }

    return true;
  },
};

/**
 * Extracts an error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error occurred";
}
