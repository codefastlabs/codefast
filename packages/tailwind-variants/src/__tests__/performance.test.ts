import { tv } from "@/index";

describe("Tailwind Variants (TV) - Performance Tests", () => {
  test("should handle large datasets efficiently - many variants", () => {
    const startTime = performance.now();

    // Create a TV with many variants
    const manyVariants = tv({
      base: "base-class",
      variants: {
        color: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [`color-${i}`, `text-color-${i}`]),
        ),
        size: Object.fromEntries(
          Array.from({ length: 20 }, (_, i) => [`size-${i}`, `text-size-${i}`]),
        ),
        spacing: Object.fromEntries(
          Array.from({ length: 30 }, (_, i) => [`spacing-${i}`, `p-${i}`]),
        ),
      },
    });

    // Execute multiple calls
    for (let i = 0; i < 1000; i++) {
      manyVariants({
        color: `color-${i % 50}`,
        size: `size-${i % 20}`,
        spacing: `spacing-${i % 30}`,
      });
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Should complete within reasonable time (adjust threshold as needed)
    expect(executionTime).toBeLessThan(1000); // 1 second
  });

  test("should handle large compound variants efficiently", () => {
    const startTime = performance.now();

    const compoundVariants = Array.from({ length: 100 }, (_, i) => ({
      class: `compound-${i}`,
      color: `color-${i % 10}`,
      size: `size-${i % 5}`,
      variant: `variant-${i % 3}`,
    }));

    const largeCompound = tv({
      base: "base-class",
      compoundVariants,
      variants: {
        color: Object.fromEntries(
          Array.from({ length: 10 }, (_, i) => [`color-${i}`, `text-color-${i}`]),
        ),
        size: Object.fromEntries(
          Array.from({ length: 5 }, (_, i) => [`size-${i}`, `text-size-${i}`]),
        ),
        variant: Object.fromEntries(
          Array.from({ length: 3 }, (_, i) => [`variant-${i}`, `variant-class-${i}`]),
        ),
      },
    });

    // Execute multiple calls
    for (let i = 0; i < 500; i++) {
      largeCompound({
        color: `color-${i % 10}`,
        size: `size-${i % 5}`,
        variant: `variant-${i % 3}`,
      });
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(1000); // 1 second
  });

  test("should handle deep slot structures efficiently", () => {
    const startTime = performance.now();

    const slots = Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [`slot-${i}`, `slot-class-${i}`]),
    );

    const variants = {
      theme: Object.fromEntries(
        Array.from({ length: 5 }, (_, i) => [
          `theme-${i}`,
          Object.fromEntries(
            Array.from({ length: 50 }, (_, j) => [`slot-${j}`, `theme-${i}-slot-${j}`]),
          ),
        ]),
      ),
    };

    const deepSlots = tv({
      slots,
      variants,
    });

    // Execute multiple calls
    for (let i = 0; i < 200; i++) {
      const result = deepSlots({ theme: `theme-${i % 5}` });
      // Access all slots to ensure they're computed
      Object.keys(slots).forEach((key) => result[key]());
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(1000); // 1 second
  });

  test("should handle multiple extends levels efficiently", () => {
    const startTime = performance.now();

    // Create a chain of extends
    let current = tv({
      base: "level-0",
      variants: {
        color: {
          primary: "primary-0",
        },
      },
    });

    // Create 10 levels of extends
    for (let i = 1; i < 10; i++) {
      current = tv({
        base: `level-${i}`,
        extend: current,
        variants: {
          color: {
            primary: `primary-${i}`,
            [`secondary-${i}`]: `secondary-class-${i}`,
          },
        },
      });
    }

    // Execute multiple calls
    for (let i = 0; i < 500; i++) {
      current({ color: "primary" });
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(1000); // 1 second
  });

  test("should handle large class strings with twMerge efficiently", () => {
    const startTime = performance.now();

    const largeClassString = Array.from({ length: 100 }, (_, i) => `class-${i}`).join(" ");

    const largeTv = tv({
      base: largeClassString,
      variants: {
        size: {
          sm: Array.from({ length: 50 }, (_, i) => `sm-${i}`).join(" "),
          md: Array.from({ length: 50 }, (_, i) => `md-${i}`).join(" "),
          lg: Array.from({ length: 50 }, (_, i) => `lg-${i}`).join(" "),
        },
      },
    });

    // Execute multiple calls
    for (let i = 0; i < 300; i++) {
      largeTv({
        size: ["sm", "md", "lg"][i % 3] as "sm" | "md" | "lg",
        className: `additional-${i}`,
      });
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(1000); // 1 second
  });
});
