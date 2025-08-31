import { tv } from "@/index";

describe("Tailwind Variants (TV) - Performance Tests", () => {
  test("should handle large datasets efficiently - many variants", () => {
    const startTime = performance.now();

    // Create a TV with many variants
    const manyVariants = tv({
      base: "base-class",
      variants: {
        color: Object.fromEntries(
          Array.from({ length: 50 }, (_, index) => [`color-${index}`, `text-color-${index}`]),
        ),
        size: Object.fromEntries(
          Array.from({ length: 20 }, (_, index) => [`size-${index}`, `text-size-${index}`]),
        ),
        spacing: Object.fromEntries(
          Array.from({ length: 30 }, (_, index) => [`spacing-${index}`, `p-${index}`]),
        ),
      },
    });

    // Execute multiple calls
    for (let index = 0; index < 1000; index++) {
      manyVariants({
        color: `color-${index % 50}`,
        size: `size-${index % 20}`,
        spacing: `spacing-${index % 30}`,
      });
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Should complete within a reasonable time (adjust a threshold as needed)
    expect(executionTime).toBeLessThan(1000); // 1 second
  });

  test("should handle large compound variants efficiently", () => {
    const startTime = performance.now();

    const compoundVariants = Array.from({ length: 100 }, (_, index) => ({
      class: `compound-${index}`,
      color: `color-${index % 10}`,
      size: `size-${index % 5}`,
      variant: `variant-${index % 3}`,
    }));

    const largeCompound = tv({
      base: "base-class",
      compoundVariants,
      variants: {
        color: Object.fromEntries(
          Array.from({ length: 10 }, (_, index) => [`color-${index}`, `text-color-${index}`]),
        ),
        size: Object.fromEntries(
          Array.from({ length: 5 }, (_, index) => [`size-${index}`, `text-size-${index}`]),
        ),
        variant: Object.fromEntries(
          Array.from({ length: 3 }, (_, index) => [`variant-${index}`, `variant-class-${index}`]),
        ),
      },
    });

    // Execute multiple calls
    for (let index = 0; index < 500; index++) {
      largeCompound({
        color: `color-${index % 10}`,
        size: `size-${index % 5}`,
        variant: `variant-${index % 3}`,
      });
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(1000); // 1 second
  });

  test("should handle deep slot structures efficiently", () => {
    const startTime = performance.now();

    const slots = Object.fromEntries(
      Array.from({ length: 50 }, (_, index) => [`slot-${index}`, `slot-class-${index}`]),
    );

    const variants = {
      theme: Object.fromEntries(
        Array.from({ length: 5 }, (_, index) => [
          `theme-${index}`,
          Object.fromEntries(
            Array.from({ length: 50 }, (_, index_) => [
              `slot-${index_}`,
              `theme-${index}-slot-${index_}`,
            ]),
          ),
        ]),
      ),
    };

    const deepSlots = tv({
      slots,
      variants,
    });

    // Execute multiple calls
    for (let index = 0; index < 200; index++) {
      const result = deepSlots({ theme: `theme-${index % 5}` });

      // Access all slots to ensure they're computed
      for (const key of Object.keys(slots)) {
        const slotFunction = result[key];

        if (typeof slotFunction === "function") {
          slotFunction();
        }
      }
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
    for (let index = 1; index < 10; index++) {
      current = tv({
        base: `level-${index}`,
        extend: current,
        variants: {
          color: {
            [`secondary-${index}`]: `secondary-class-${index}`,
            primary: `primary-${index}`,
          },
        },
      });
    }

    // Execute multiple calls
    for (let index = 0; index < 500; index++) {
      current({ color: "primary" });
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(1000); // 1 second
  });

  test("should handle large class strings with twMerge efficiently", () => {
    const startTime = performance.now();

    const largeClassString = Array.from({ length: 100 }, (_, index) => `class-${index}`).join(" ");

    const largeTv = tv({
      base: largeClassString,
      variants: {
        size: {
          lg: Array.from({ length: 50 }, (_, index) => `lg-${index}`).join(" "),
          md: Array.from({ length: 50 }, (_, index) => `md-${index}`).join(" "),
          sm: Array.from({ length: 50 }, (_, index) => `sm-${index}`).join(" "),
        },
      },
    });

    // Execute multiple calls
    for (let index = 0; index < 300; index++) {
      largeTv({
        className: `additional-${index}`,
        size: ["sm", "md", "lg"][index % 3] as "lg" | "md" | "sm",
      });
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(1000); // 1 second
  });
});
