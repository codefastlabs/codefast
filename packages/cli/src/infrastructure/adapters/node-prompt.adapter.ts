import { injectable } from "inversify";
import readline from "node:readline";

import type { PromptPort } from "@/application/ports/prompt.port";

@injectable()
export class NodePromptAdapter implements PromptPort {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async prompt(message: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(message, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  close(): void {
    this.rl.close();
  }
}
