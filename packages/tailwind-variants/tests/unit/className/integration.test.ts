import { createTV, tv } from "#index";

describe("Tailwind Variants (TV) - Integration Tests", () => {
  test("should work with realistic button component patterns", () => {
    const buttonVariants = tv({
      base: "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
      defaultVariants: {
        size: "default",
        variant: "default",
      },
      variants: {
        size: {
          default: "h-10 px-4 py-2",
          icon: "h-10 w-10",
          lg: "h-11 rounded-md px-8",
          sm: "h-9 rounded-md px-3",
        },
        variant: {
          default: "bg-primary text-primary-foreground hover:bg-primary/90",
          destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          ghost: "hover:bg-accent hover:text-accent-foreground",
          link: "text-primary underline-offset-4 hover:underline",
          outline: "border-input border hover:bg-accent hover:text-accent-foreground",
          secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        },
      },
    });

    expect(buttonVariants()).toContain("bg-primary");
    expect(buttonVariants()).toContain("h-10");

    const destructiveLarge = buttonVariants({ size: "lg", variant: "destructive" });

    expect(destructiveLarge).toContain("bg-destructive");
    expect(destructiveLarge).toContain("h-11");

    const customButton = buttonVariants({
      className: "w-full",
      variant: "outline",
    });

    expect(customButton).toContain("border");
    expect(customButton).toContain("w-full");
  });

  test("should work with realistic card component with slots", () => {
    const cardVariants = tv({
      defaultVariants: {
        size: "default",
        variant: "default",
      },
      slots: {
        base: "rounded-lg border bg-card text-card-foreground shadow-sm",
        content: "p-6 pt-0",
        description: "text-sm text-muted-foreground",
        footer: "flex items-center p-6 pt-0",
        header: "flex flex-col space-y-1.5 p-6",
        title: "text-lg leading-none font-semibold tracking-tight",
      },
      variants: {
        size: {
          default: {},
          lg: {
            content: "p-8 pt-0",
            footer: "p-8 pt-0",
            header: "p-8",
          },
          sm: {
            content: "p-4 pt-0",
            footer: "p-4 pt-0",
            header: "p-4",
          },
        },
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
      },
    });

    const { base, content, description, footer, header, title } = cardVariants({
      size: "sm",
      variant: "destructive",
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
      compoundVariants: [
        {
          className: {
            list: "space-y-2",
          },
          orientation: "vertical",
          variant: "pills",
        },
      ],
      defaultVariants: {
        orientation: "horizontal",
        variant: "default",
      },
      slots: {
        content:
          "top-0 left-0 w-full data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out md:absolute md:w-auto",
        indicator:
          "top-full z-1 flex h-1.5 items-end justify-center overflow-hidden data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:animate-in data-[state=visible]:fade-in",
        item: "",
        link: "block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        list: "group flex flex-1 list-none items-center justify-center space-x-1",
        root: "relative z-10 flex max-w-max flex-1 items-center justify-center",
        trigger:
          "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
      },
      variants: {
        orientation: {
          horizontal: {
            list: "flex-row",
          },
          vertical: {
            list: "flex-col space-y-1 space-x-0",
            root: "flex-col",
          },
        },
        variant: {
          default: {},
          pills: {
            link: "rounded-full",
            trigger: "rounded-full",
          },
        },
      },
    });

    const { link, list, root, trigger } = navigationMenuVariants({
      orientation: "vertical",
      variant: "pills",
    });

    expect(root()).toContain("flex-col");
    expect(list()).toContain("flex-col");
    expect(list()).toContain("space-y-2");
    expect(trigger()).toContain("rounded-full");
    expect(link()).toContain("rounded-full");
  });

  test("should work with theme system using createTV", () => {
    const { tv: createThemeTV } = createTV({
      twMergeConfig: {
        extend: {
          classGroups: {
            "font-size": [{ text: ["xs", "sm", "base", "lg", "xl", "2xl"] }],
          },
        },
      },
    });

    const alertVariants = createThemeTV({
      base: "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:-translate-y-0.75 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
      defaultVariants: {
        variant: "default",
      },
      variants: {
        variant: {
          default: "bg-background text-foreground",
          destructive:
            "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        },
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
      base: "border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      defaultVariants: {
        size: "default",
      },
      variants: {
        size: {
          default: "h-10",
          lg: "h-12 px-4 text-base",
          sm: "h-8 px-2 text-xs",
        },
      },
    });

    const textareaVariants = tv({
      base: "min-h-20 resize-none",
      extend: baseInputVariants,
      variants: {
        size: {
          default: "py-2",
          lg: "min-h-25 py-3",
          sm: "min-h-15 py-1",
        },
      },
    });

    const selectVariants = tv({
      base: "cursor-default",
      extend: baseInputVariants,
      variants: {
        size: {
          default: "pr-8",
          lg: "pr-10",
          sm: "pr-6",
        },
      },
    });

    const input = baseInputVariants({ size: "sm" });
    const textarea = textareaVariants({ size: "sm" });
    const select = selectVariants({ size: "lg" });

    expect(input).toContain("h-8");
    expect(textarea).toContain("min-h-15");
    expect(textarea).toContain("border-input");
    expect(select).toContain("pr-10");
    expect(select).toContain("cursor-default");
    expect(select).toContain("ring-offset-background");
  });

  test("should work with responsive design patterns", () => {
    const responsiveGridVariants = tv({
      base: "grid gap-4",
      defaultVariants: {
        cols: 1,
        gap: "md",
      },
      variants: {
        cols: {
          1: "grid-cols-1",
          2: "grid-cols-1 md:grid-cols-2",
          3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
          auto: "grid-cols-[repeat(auto-fit,minmax(250px,1fr))]",
        },
        gap: {
          lg: "gap-6",
          md: "gap-4",
          sm: "gap-2",
          xl: "gap-8",
        },
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
