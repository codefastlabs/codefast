function parseClasses(result: string | string[]): string[] {
  return [...(typeof result === "string" ? result.split(" ") : result)].sort();
}

expect.extend({
  toHaveClass(received: string | string[], expected: string | string[]) {
    const parsedExpected = parseClasses(expected);
    const parsedReceived = parseClasses(received);

    return {
      message: (): string => {
        return (
          this.utils.matcherHint(
            `${this.isNot ? ".not" : ""}.toHaveClass`,
            "element",
            this.utils.printExpected(parsedExpected.join(" ")),
          ) +
          "\n\n" +
          this.utils.printDiffOrStringify(
            parsedExpected,
            parsedReceived,
            "Expected",
            "Received",
            this.expand !== false,
          )
        );
      },
      pass:
        this.equals(parsedExpected, parsedReceived) &&
        parsedExpected.length === parsedReceived.length,
    };
  },
});

declare module "expect" {
  interface Matchers<R> {
    toHaveClass: (expected: string | string[]) => R;
  }
}
