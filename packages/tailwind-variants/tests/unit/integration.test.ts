import { createTV, tv } from "@/index";

describe("Tailwind Variants (TV) - Integration Tests", () => {
  test("should work with realistic button component patterns", () => {
    const buttonVariants = tv({
      base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground hover:bg-primary/90",
          destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          outline: "border border-input hover:bg-accent hover:text-accent-foreground",
          secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          ghost: "hover:bg-accent hover:text-accent-foreground",
          link: "underline-offset-4 hover:underline text-primary",
        },
        size: {
          default: "h-10 py-2 px-4",
          sm: "h-9 px-3 rounded-md",
          lg: "h-11 px-8 rounded-md",
          icon: "h-10 w-10",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    });

    // Test default button
    expect(buttonVariants()).toContain("bg-primary");
    expect(buttonVariants()).toContain("h-10");

    // Test destructive large button
    const destructiveLarge = buttonVariants({ variant: "destructive", size: "lg" });
    expect(destructiveLarge).toContain("bg-destructive");
    expect(destructiveLarge).toContain("h-11");

    // Test with custom className
    const customButton = buttonVariants({
      variant: "outline",
      className: "w-full",
    });
    expect(customButton).toContain("border");
    expect(customButton).toContain("w-full");
  });

  test("should work with realistic card component with slots", () => {
    const cardVariants = tv({
      slots: {
        base: "rounded-lg border bg-card text-card-foreground shadow-sm",
        header: "flex flex-col space-y-1.5 p-6",
        title: "text-lg font-semibold leading-none tracking-tight",
        description: "text-sm text-muted-foreground",
        content: "p-6 pt-0",
        footer: "flex items-center p-6 pt-0",
      },
      variants: {
        variant: {
          default: {
            base: "bg-card",
          },
          destructive: {
            base: "border-destructive/50 text-destructive dark:border-destructive",
            title: "text-destructive",
          },
          success: {
            base: "border-green-500/50 text-green-600 dark:border-green-500",
            title: "text-green-600",
          },
        },
        size: {
          default: {},
          sm: {
            header: "p-4",
            content: "p-4 pt-0",
            footer: "p-4 pt-0",
          },
          lg: {
            header: "p-8",
            content: "p-8 pt-0",
            footer: "p-8 pt-0",
          },
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    });

    const { base, header, title, description, content, footer } = cardVariants({
      variant: "destructive",
      size: "sm",
    });

    expect(base()).toContain("border-destructive/50");
    expect(header()).toContain("p-4");
    expect(title()).toContain("text-destructive");
    expect(description()).toContain("text-sm");
    expect(content()).toContain("p-4");
    expect(footer()).toContain("p-4");
  });

  test("should work with realistic navigation menu with compound variants", () => {
    const navigationMenuVariants = tv({
      slots: {
        root: "relative z-10 flex max-w-max flex-1 items-center justify-center",
        list: "group flex flex-1 list-none items-center justify-center space-x-1",
        item: "",
        trigger:
          "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
        content:
          "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto",
        link: "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        indicator:
          "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      },
      variants: {
        variant: {
          default: {},
          pills: {
            trigger: "rounded-full",
            link: "rounded-full",
          },
        },
        orientation: {
          horizontal: {
            list: "flex-row",
          },
          vertical: {
            root: "flex-col",
            list: "flex-col space-x-0 space-y-1",
          },
        },
      },
      compoundVariants: [
        {
          variant: "pills",
          orientation: "vertical",
          class: {
            list: "space-y-2",
          },
        },
      ],
      defaultVariants: {
        variant: "default",
        orientation: "horizontal",
      },
    });

    const { root, list, trigger, link } = navigationMenuVariants({
      variant: "pills",
      orientation: "vertical",
    });

    expect(root()).toContain("flex-col");
    expect(list()).toContain("flex-col");
    expect(list()).toContain("space-y-2"); // compound variant
    expect(trigger()).toContain("rounded-full");
    expect(link()).toContain("rounded-full");
  });

  test("should work with theme system using createTV", () => {
    const createThemeTV = createTV({
      twMergeConfig: {
        extend: {
          classGroups: {
            "font-size": [{ text: ["xs", "sm", "base", "lg", "xl", "2xl"] }],
          },
        },
      },
    });

    const alertVariants = createThemeTV({
      base: "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
      variants: {
        variant: {
          default: "bg-background text-foreground",
          destructive:
            "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        },
      },
      defaultVariants: {
        variant: "default",
      },
    });

    const defaultAlert = alertVariants();
    const destructiveAlert = alertVariants({ variant: "destructive" });

    expect(defaultAlert).toContain("bg-background");
    expect(destructiveAlert).toContain("border-destructive/50");
    expect(destructiveAlert).toContain("[&>svg]:text-destructive");
  });

  test("should work with complex form components with extends", () => {
    const baseInputVariants = tv({
      base: "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      variants: {
        size: {
          default: "h-10",
          sm: "h-8 text-xs px-2",
          lg: "h-12 text-base px-4",
        },
      },
      defaultVariants: {
        size: "default",
      },
    });

    const textareaVariants = tv({
      extend: baseInputVariants,
      base: "min-h-[80px] resize-none",
      variants: {
        size: {
          default: "py-2",
          sm: "py-1 min-h-[60px]",
          lg: "py-3 min-h-[100px]",
        },
      },
    });

    const selectVariants = tv({
      extend: baseInputVariants,
      base: "cursor-default",
      variants: {
        size: {
          default: "pr-8",
          sm: "pr-6",
          lg: "pr-10",
        },
      },
    });

    // Test inheritance
    const input = baseInputVariants({ size: "sm" });
    const textarea = textareaVariants({ size: "sm" });
    const select = selectVariants({ size: "lg" });

    expect(input).toContain("h-8");
    expect(textarea).toContain("min-h-[60px]");
    expect(textarea).toContain("border-input"); // inherited
    expect(select).toContain("pr-10");
    expect(select).toContain("cursor-default");
    expect(select).toContain("ring-offset-background"); // inherited
  });

  test("should work with responsive design patterns", () => {
    const responsiveGridVariants = tv({
      base: "grid gap-4",
      variants: {
        cols: {
          1: "grid-cols-1",
          2: "grid-cols-1 md:grid-cols-2",
          3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
          auto: "grid-cols-[repeat(auto-fit,minmax(250px,1fr))]",
        },
        gap: {
          sm: "gap-2",
          md: "gap-4",
          lg: "gap-6",
          xl: "gap-8",
        },
      },
      defaultVariants: {
        cols: 1,
        gap: "md",
      },
    });

    const grid3Cols = responsiveGridVariants({ cols: 3, gap: "lg" });
    const autoGrid = responsiveGridVariants({ cols: "auto" });

    expect(grid3Cols).toContain("md:grid-cols-2");
    expect(grid3Cols).toContain("lg:grid-cols-3");
    expect(grid3Cols).toContain("gap-6");
    expect(autoGrid).toContain("repeat(auto-fit,minmax(250px,1fr))");
  });
});
