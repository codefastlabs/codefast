/** validate() over the live shop, with OrderService bound as shipped or as the captive singleton. */
import type { Container } from "@codefast/di";

import { createShop } from "#/features/home/demos/shop";

/** The live shop's container; `fixed` keeps OrderService transient, otherwise it becomes the singleton validate() refuses. */
export function createCaptiveContainer(fixed: boolean): Container {
  return createShop({ orderService: fixed ? "transient" : "singleton" }).container;
}

/** What validate() says about a container: the message it throws, or null when the graph is sound. */
export function validationMessage(container: Container): string | null {
  try {
    container.validate();

    return null;
  } catch (error: unknown) {
    // The message alone: a class name would differ between the server render and the minified client bundle.
    return error instanceof Error ? error.message : String(error);
  }
}
