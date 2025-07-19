/**
 * Greet User Use Case
 *
 * Application layer use case for greeting users.
 * Following explicit architecture guidelines for CLI applications.
 */

import { inject, injectable } from "inversify";

import type { ILoggingService } from "@/core/application/ports/logging.port";

import { TYPES } from "@/di/types";

export interface GreetUserInput {
  name: string;
}

@injectable()
export class GreetUserUseCase {
  constructor(@inject(TYPES.LoggingService) private readonly loggingService: ILoggingService) {}

  execute(input: GreetUserInput): void {
    const { name } = input;

    this.loggingService.success(`Hello, ${name}!`);
  }
}
