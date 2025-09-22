function parseClasses(result: string | string[]): string[] {
  return [...(typeof result === "string" ? result.split(" ") : result)].toSorted();
}

expect.extend({
  toHaveClassName(received: string | string[], expected: string | string[]) {
    const parsedExpected = parseClasses(expected);
    const parsedReceived = parseClasses(received);

    return {
      message: (): string => {
        return (
          this.utils.matcherHint(
            `${this.isNot ? ".not" : ""}.toHaveClassName`,
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

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveClassName: (expected: string | string[]) => R;
    }
  }
}
