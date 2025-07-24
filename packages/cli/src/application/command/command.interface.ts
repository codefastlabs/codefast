/**
 * Command Interface
 *
 * Base interface for all commands in the CQRS pattern.
 * Commands represent write operations that change system state.
 */

export interface Command {
  readonly timestamp: Date;
}
