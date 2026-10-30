import { tv } from "#index";

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
