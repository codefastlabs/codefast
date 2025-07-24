/**
 * Greet User Use Case
 *
 * Application layer use case for greeting users.
 * Following explicit architecture guidelines for CLI applications.
 */

import { inject, injectable } from "inversify";

import type { LoggingServicePort } from "@/application/ports/secondary/services/logging.service.port";

import { TYPES } from "@/shared/di/types";

export interface GreetUserInput {
  name: string;
}

@injectable()
export class GreetUserUseCase {
  constructor(
    @inject(TYPES.LoggingServicePort)
    private readonly loggingService: LoggingServicePort,
  ) {}

  execute(input: GreetUserInput): void {
    const { name } = input;
    const displayName = name.trim() || "World";

    this.loggingService.success(`Hello, ${displayName}!`);
  }
}
