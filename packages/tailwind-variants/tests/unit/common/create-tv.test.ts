import { createTV } from "#index";

describe("createTV", () => {
  test("should use config in tv calls", () => {
    const { tv } = createTV({ twMerge: false });
    const h1 = tv({ base: "text-3xl text-xl font-bold text-blue-200 text-blue-400" });

    expect(h1()).toHaveClassName("text-3xl font-bold text-blue-400 text-xl text-blue-200");
  });

  test("should override config", () => {
    const { tv } = createTV({ twMerge: false });
    const h1 = tv({ base: "text-3xl text-xl font-bold text-blue-200 text-blue-400" }, { twMerge: true });

    expect(h1()).toHaveClassName("font-bold text-blue-400 text-xl");
  });

  test("falls back to the shared option for a local one left undefined", () => {
    const { tv } = createTV({ twMerge: false });
    const twMerge: boolean | undefined = undefined;
    const h1 = tv({ base: "text-3xl text-xl font-bold text-blue-200 text-blue-400" }, { twMerge });

    expect(h1()).toHaveClassName("text-3xl font-bold text-blue-400 text-xl text-blue-200");
  });

  test("forwards a possibly-undefined cacheResolutions without narrowing it first", () => {
    const { tv } = createTV({ cacheResolutions: false });
    const cacheResolutions: boolean | undefined = undefined;
    const h1 = tv({ base: "text-xl" }, { cacheResolutions });

    expect(h1()).toBe("text-xl");
  });
});
