/**
 * Port for prompting user input.
 */
export interface PromptPort {
  close: () => void;
  prompt: (message: string) => Promise<string>;
}
