import { tv } from "#index";
import { everyLane, readEveryLane } from "#tests/unit/support/lanes";

type SlotResolvers = Record<string, (props?: Record<string, unknown>) => string | undefined>;
type UntypedSlotsResolver = (props?: Record<string, unknown>) => SlotResolvers;

/** `tv()` over a configuration as data, so slot props the types would reject still reach the resolver. */
const untypedSlotsTv = tv as (configuration: object, options?: object) => UntypedSlotsResolver;

const CARD = {
  compoundSlots: [{ class: "gap-6", size: "lg", slots: ["base", "footer"] }],
  compoundVariants: [
    { class: { title: "animate-pulse" }, loading: true },
    { class: { base: "ring-2" }, size: "lg", tone: "accent" },
  ],
  defaultVariants: { size: "md", tone: "plain" },
  slots: { base: "flex p-4", footer: "flex justify-end", title: "text-sm font-medium" },
  variants: {
    size: { lg: { base: "p-8", title: "text-lg" }, md: { base: "p-4" } },
    tone: { accent: { base: "bg-accent", title: "text-accent-foreground" }, plain: "" },
  },
};

const SELECTIONS: ReadonlyArray<Record<string, unknown>> = [{}, { size: "lg" }, { size: "lg", tone: "accent" }];

const SLOT_PROPS: ReadonlyArray<Record<string, unknown> | undefined> = [
  undefined,
  {},
  { className: undefined },
  { className: "p-2" },
  { class: "text-xs" },
  { class: "p-6", className: "p-2" },
  { className: "" },
  { size: "lg" },
  { className: "p-2", size: "md" },
  { loading: true },
  { className: "p-2", loading: undefined },
];

/** A slot's answer from a fresh resolver's first call, which reads the configuration directly. */
const coldAnswer = (
  options: object,
  selection: Record<string, unknown>,
  slot: string,
  slotProps: Record<string, unknown> | undefined,
): string | undefined => untypedSlotsTv(CARD, options)(selection)[slot]?.(slotProps);

describe("slot lane", () => {
  for (const options of [{}, { twMerge: false }, { cacheResolutions: false }]) {
    test(`answers every slot call as the cold lane does (${JSON.stringify(options)})`, () => {
      const card = untypedSlotsTv(CARD, options);

      for (const selection of SELECTIONS) {
        card(selection);
      }

      for (const selection of SELECTIONS) {
        const slots = card(selection);

        for (const slot of Object.keys(CARD.slots)) {
          for (const slotProps of SLOT_PROPS) {
            expect(slots[slot]?.(slotProps)).toBe(coldAnswer(options, selection, slot, slotProps));
          }
        }
      }
    });
  }

  test("answers a slot called with only an absent className as a bare call", () => {
    const card = untypedSlotsTv(CARD);

    card({ size: "lg" });

    const slots = card({ size: "lg" });

    expect(slots.base?.({ className: undefined })).toBe(slots.base?.());
    expect(slots.base?.({ className: "" })).toBe("flex p-8 gap-6");
  });

  test("lets a compound condition no variant declares still re-resolve the slot", () => {
    const card = untypedSlotsTv(CARD);

    card({});

    expect(card({}).title?.({ loading: true })).toBe("text-sm font-medium animate-pulse");
    expect(card({}).title?.({ className: "text-xs" })).toBe("font-medium text-xs");
  });
});

describe("slot lane, against upstream's rules", () => {
  const F = { twMerge: false };

  test("reads a slot's own props in a compound slot's conditions", () => {
    const answers = readEveryLane(
      () =>
        untypedSlotsTv(
          {
            compoundSlots: [{ class: "cursor-pointer", disabled: false, slots: ["item"] }],
            slots: { base: "b", item: "i" },
            variants: { disabled: { true: { item: "opacity-50" } } },
          },
          F,
        ),
      (resolver) => {
        const slots = resolver();

        return [slots.item?.(), slots.item?.({ disabled: true })];
      },
    );

    expect(answers).toEqual(everyLane(["i cursor-pointer", "i opacity-50"]));
  });

  test("adds nothing for a compound slot whose classes are empty", () => {
    const answers = readEveryLane(
      () =>
        untypedSlotsTv(
          {
            compoundSlots: [{ class: "", size: "sm", slots: ["item"] }],
            slots: { base: "b", item: "i" },
            variants: { size: { md: "", sm: "" } },
          },
          F,
        ),
      (resolver) => {
        const slots = resolver({ size: "sm" });

        return [slots.item?.(), slots.item?.({ className: "x" }), slots.item?.({ size: "sm" })];
      },
    );

    expect(answers).toEqual(everyLane(["i", "i x", "i"]));
  });

  test("applies a compound slot once per time it lists a slot, on every path", () => {
    const answers = readEveryLane(
      () =>
        untypedSlotsTv(
          {
            compoundSlots: [{ class: "px-2", slots: ["item", "item"] }],
            slots: { base: "b", item: "i" },
            variants: { size: { md: "", sm: "" } },
          },
          F,
        ),
      (resolver) => {
        const slots = resolver({ size: "sm" });

        return [slots.item?.(), slots.item?.({ size: "md" })];
      },
    );

    expect(answers).toEqual(everyLane(["i px-2 px-2", "i px-2 px-2"]));
  });

  test("answers a slot called with null as one called without props", () => {
    const answers = readEveryLane(
      () => untypedSlotsTv({ slots: { base: "b", item: "i" }, variants: { size: { sm: { item: "s" } } } }, F),
      (resolver) => resolver({ size: "sm" }).item?.(null as never),
    );

    expect(answers).toEqual(everyLane("i s"));
  });

  test("keeps the call's selection for a slot prop left null or undefined", () => {
    const answers = readEveryLane(
      () =>
        untypedSlotsTv(
          {
            compoundVariants: [{ class: { item: "ring" }, size: "sm" }],
            slots: { base: "b", item: "i" },
            variants: { size: { md: { item: "m" }, sm: { item: "s" } } },
          },
          F,
        ),
      (resolver) => {
        const slots = resolver({ size: "sm" });

        // A null slot prop still reaches a compound as null, which no `size` condition here names.
        return [slots.item?.({ size: undefined }), slots.item?.({ size: null })];
      },
    );

    expect(answers).toEqual(everyLane(["i s ring", "i s"]));
  });
});
