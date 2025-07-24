/**
 * Command Interface
 *
 * Base interface for all CLI commands following Explicit Architecture principles.
 * Each command should implement this interface to ensure consistency and scalability.
 */

import type { Command } from "commander";

export interface CommandInterface {
  /**
   * The command name (e.g., "hello", "analyze")
   */
  readonly name: string;

  /**
   * Command description for help text
   */
  readonly description: string;

  /**
   * Register the command with the Commander.js program
   * @param program - The Commander.js program instance
   */
  register: (program: Command) => void;
}

/**
 * Command metadata for registration and discovery
 */
export interface CommandMetadata {
  category?: string;
  description: string;
  name: string;
  priority?: number;
}
