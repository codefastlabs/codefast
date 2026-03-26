import type { VariantProps } from "@/index";

/**
 * Verification of README code examples - ensures documented examples work correctly.
 */
import { cn, createTV, cx, tv } from "@/index";

describe("README code examples", () => {
  test("Quick Start - button variants", () => {
    const button = tv({
      base: "inline-flex items-center justify-center rounded-md font-medium transition-colors",
      variants: {
        size: {
          lg: "h-11 px-8",
          md: "h-10 px-4",
          sm: "h-9 px-3 text-sm",
        },
        variant: {
          default: "bg-primary text-primary-foreground hover:bg-primary/90",
          destructive: "text-destructive-foreground bg-destructive hover:bg-destructive/90",
          outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        },
      },
      defaultVariants: {
        size: "md",
        variant: "default",
      },
    });

    const r1 = button();

    expect(r1).toMatch(/inline-flex/);
    expect(r1).toMatch(/bg-primary/);
    expect(r1).toMatch(/h-10/);

    const r2 = button({ size: "lg", variant: "destructive" });

    expect(r2).toMatch(/bg-destructive/);
    expect(r2).toMatch(/h-11/);

    const r3 = button({ className: "w-full", size: "sm", variant: "outline" });

    expect(r3).toMatch(/border/);
    expect(r3).toMatch(/h-9/);
    expect(r3).toMatch(/w-full/);
  });

  test("Slots - card component", () => {
    const card = tv({
      slots: {
        base: "rounded-lg border bg-card text-card-foreground shadow-sm",
        content: "p-6 pt-0",
        footer: "flex items-center p-6 pt-0",
        header: "flex flex-col space-y-1.5 p-6",
      },
      variants: {
        variant: {
          default: "",
          destructive: {
            base: "border-destructive",
            header: "text-destructive",
          },
        },
      },
    });

    const cardStyles = card();

    expect(cardStyles.base()).toMatch(/rounded-lg/);
    expect(cardStyles.header()).toMatch(/flex/);

    const destructiveCard = card({ variant: "destructive" });

    expect(destructiveCard.base()).toMatch(/border-destructive/);
    expect(destructiveCard.header()).toMatch(/text-destructive/);
  });

  test("cn and cx utility functions", () => {
    expect(cn("px-4 py-2", "px-6 py-3")).toBe("px-6 py-3");
    const cxResult = cx("px-4 py-2", "px-6 py-3");

    expect(cxResult).toMatch(/px-4/);
    expect(cxResult).toMatch(/px-6/);
  });

  test("VariantProps type", () => {
    const button = tv({
      base: "px-4 py-2",
      variants: { variant: { primary: "bg-blue-500", secondary: "bg-gray-500" } },
    });

    type ButtonVariants = VariantProps<typeof button>;
    const props: ButtonVariants = { variant: "primary" };

    expect(button(props)).toBeDefined();
  });

  test("createTV factory", () => {
    const { cn: cn2, tv: tv2 } = createTV({ twMerge: true });

    expect(typeof tv2).toBe("function");
    expect(typeof cn2).toBe("function");
  });
});
