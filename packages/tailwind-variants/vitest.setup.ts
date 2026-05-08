function parseClasses(result: string | Array<string>): Array<string> {
  return [...(typeof result === "string" ? result.split(" ") : result)].toSorted();
}

expect.extend({
  toHaveClassName(received: string | Array<string>, expected: string | Array<string>) {
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
          `Expected: ${this.utils.printExpected(parsedExpected)}\n` +
          `Received: ${this.utils.printReceived(parsedReceived)}`
        );
      },
      pass:
        this.equals(parsedExpected, parsedReceived) &&
        parsedExpected.length === parsedReceived.length,
    };
  },
});
