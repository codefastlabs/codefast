/** Whether a value is what `toHaveClassName` compares: a class string or an array of class strings. */
function isClassList(value: unknown): value is string | Array<string> {
  return typeof value === "string" || (Array.isArray(value) && value.every((item) => typeof item === "string"));
}

function parseClasses(result: string | Array<string>): Array<string> {
  return [...(typeof result === "string" ? result.split(" ") : result)].toSorted();
}

expect.extend({
  toHaveClassName(received: unknown, expected: string | Array<string>) {
    const hint = this.utils.matcherHint(`${this.isNot ? ".not" : ""}.toHaveClassName`, "received", "expected");

    if (!isClassList(received)) {
      // Fails either way: a value that is not a class list neither has nor lacks the classes.
      return {
        message: (): string =>
          `${hint}\n\nReceived must be a class string or an array of class strings, but got ${this.utils.printReceived(received)}`,
        pass: this.isNot,
      };
    }

    const parsedExpected = parseClasses(expected);
    const parsedReceived = parseClasses(received);

    return {
      message: (): string =>
        `${hint}\n\n` +
        `Expected: ${this.utils.printExpected(parsedExpected)}\n` +
        `Received: ${this.utils.printReceived(parsedReceived)}`,
      pass: this.equals(parsedExpected, parsedReceived),
    };
  },
});
