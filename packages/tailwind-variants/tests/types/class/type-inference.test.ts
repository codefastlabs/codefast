import { expectTypeOf } from "expect-type";

import type { ClassValue, VariantProps } from "@/index";

import { createTV, tv } from "@/index";

describe("Real-World Type Inference Tests", () => {
  test("should infer types for button component in real usage", () => {
    // Real-world button component definition
    const buttonVariants = tv({
      base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
      defaultVariants: {
        size: "default",
        variant: "default",
      },
      variants: {
        size: {
          default: "h-10 py-2 px-4",
          icon: "h-10 w-10",
          lg: "h-11 px-8 rounded-md",
          sm: "h-9 px-3 rounded-md",
        },
        variant: {
          default: "bg-primary text-primary-foreground hover:bg-primary/90",
          destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          ghost: "hover:bg-accent hover:text-accent-foreground",
          link: "underline-offset-4 hover:underline text-primary",
          outline: "border border-input hover:bg-accent hover:text-accent-foreground",
          secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        },
      },
    });

    // Real-world usage: When a developer calls this function, TypeScript should infer the correct types
    const button = buttonVariants({ size: "lg", variant: "destructive" });

    // Test that VariantProps correctly extracts the parameter types
    type ButtonProps = VariantProps<typeof buttonVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<ButtonProps["size"]>().toEqualTypeOf<
      "default" | "icon" | "lg" | "sm" | undefined
    >();
    expectTypeOf<ButtonProps["variant"]>().toEqualTypeOf<
      "default" | "destructive" | "ghost" | "link" | "outline" | "secondary" | undefined
    >();
    expectTypeOf<ButtonProps["class"]>().toEqualTypeOf<ClassValue>();

    // Test that the function can be called and returns a value
    expectTypeOf(button).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for card component with slots in real usage", () => {
    // Real-world card component definition
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
        title: "text-lg font-semibold leading-none tracking-tight",
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

    // Real-world usage: When a developer calls this function, TypeScript should infer the correct types
    const card = cardVariants({ size: "sm", variant: "destructive" });

    // Test that VariantProps correctly extracts the parameter types
    type CardProps = VariantProps<typeof cardVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<CardProps["size"]>().toEqualTypeOf<"default" | "lg" | "sm" | undefined>();
    expectTypeOf<CardProps["variant"]>().toEqualTypeOf<
      "default" | "destructive" | "success" | undefined
    >();

    // Test that slot functions are available and have correct types
    expectTypeOf(card).toHaveProperty("base");
    expectTypeOf(card).toHaveProperty("content");
    expectTypeOf(card).toHaveProperty("header");

    // Test slot function parameters using VariantProps
    type BaseSlotProps = VariantProps<typeof card.base>;
    expectTypeOf<BaseSlotProps["class"]>().toEqualTypeOf<ClassValue>();

    // Test slot function return type
    const baseResult = card.base();

    expectTypeOf(baseResult).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for toggle component with boolean variants in real usage", () => {
    // Real-world toggle component definition
    const toggleVariants = tv({
      base: "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      defaultVariants: {
        disabled: false,
        size: "default",
      },
      variants: {
        disabled: {
          false: "",
          true: "opacity-50 cursor-not-allowed",
        },
        size: {
          default: "h-6 w-11",
          lg: "h-8 w-14",
          sm: "h-4 w-8",
        },
      },
    });

    // Real-world usage: When a developer calls this function, TypeScript should infer the correct types
    const toggle = toggleVariants({ disabled: true, size: "lg" });

    // Test that VariantProps correctly extracts the parameter types
    type ToggleProps = VariantProps<typeof toggleVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<ToggleProps["disabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ToggleProps["size"]>().toEqualTypeOf<"default" | "lg" | "sm" | undefined>();

    // Test that the function can be called and returns a value
    expectTypeOf(toggle).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for form components with extends in real usage", () => {
    // Real-world base input component
    const baseInputVariants = tv({
      base: "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      defaultVariants: {
        size: "default",
      },
      variants: {
        size: {
          default: "h-10",
          lg: "h-12 text-base px-4",
          sm: "h-8 text-xs px-2",
        },
      },
    });

    // Real-world textarea component that extends base input
    const textareaVariants = tv({
      base: "min-h-[80px] resize-none",
      extend: baseInputVariants,
      variants: {
        size: {
          default: "py-2",
          lg: "py-3 min-h-[100px]",
          sm: "py-1 min-h-[60px]",
        },
      },
    });

    // Real-world usage: When a developer calls this function, TypeScript should infer the correct types
    const textarea = textareaVariants({ size: "lg" });

    // Test that VariantProps correctly extracts the parameter types
    type TextareaProps = VariantProps<typeof textareaVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<TextareaProps["size"]>().toEqualTypeOf<"default" | "lg" | "sm" | undefined>();

    // Test that the function can be called and returns a value
    expectTypeOf(textarea).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for navigation menu with compound variants in real usage", () => {
    // Real-world navigation menu component
    const navigationMenuVariants = tv({
      compoundVariants: [
        {
          class: {
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
          "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto",
        indicator:
          "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
        item: "",
        link: "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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
            list: "flex-col space-x-0 space-y-1",
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

    // Real-world usage: When a developer calls this function, TypeScript should infer the correct types
    const navigation = navigationMenuVariants({ orientation: "vertical", variant: "pills" });

    // Test that VariantProps correctly extracts the parameter types
    type NavigationProps = VariantProps<typeof navigationMenuVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<NavigationProps["orientation"]>().toEqualTypeOf<
      "horizontal" | "vertical" | undefined
    >();
    expectTypeOf<NavigationProps["variant"]>().toEqualTypeOf<"default" | "pills" | undefined>();

    // Test that slot functions are available
    expectTypeOf(navigation).toHaveProperty("list");
    expectTypeOf(navigation).toHaveProperty("root");

    // Test slot function return type
    const listResult = navigation.list();

    expectTypeOf(listResult).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for pagination with compound slots in real usage", () => {
    // Real-world pagination component
    const paginationVariants = tv({
      compoundSlots: [
        {
          class: ["bg-primary", "text-primary-foreground"],
          size: "sm",
          slots: ["item", "prev", "next"],
          variant: "default",
        },
      ],
      defaultVariants: {
        size: "default",
        variant: "default",
      },
      slots: {
        base: "flex items-center justify-center space-x-2",
        cursor: ["relative", "inline-flex", "items-center", "justify-center"],
        item: "relative inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        next: "relative inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        prev: "relative inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      },
      variants: {
        size: {
          default: {
            item: "h-10 w-10",
            next: "h-10 w-10",
            prev: "h-10 w-10",
          },
          lg: {
            item: "h-12 w-12",
            next: "h-12 w-12",
            prev: "h-12 w-12",
          },
          sm: {
            item: "h-8 w-8",
            next: "h-8 w-8",
            prev: "h-8 w-8",
          },
        },
        variant: {
          default: {
            item: "hover:bg-accent hover:text-accent-foreground",
            next: "hover:bg-accent hover:text-accent-foreground",
            prev: "hover:bg-accent hover:text-accent-foreground",
          },
          outline: {
            item: "border border-input hover:bg-accent hover:text-accent-foreground",
            next: "border border-input hover:bg-accent hover:text-accent-foreground",
            prev: "border border-input hover:bg-accent hover:text-accent-foreground",
          },
        },
      },
    });

    // Real-world usage: When a developer calls this function, TypeScript should infer the correct types
    const pagination = paginationVariants({ size: "sm", variant: "default" });

    // Test that VariantProps correctly extracts the parameter types
    type PaginationProps = VariantProps<typeof paginationVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<PaginationProps["size"]>().toEqualTypeOf<"default" | "lg" | "sm" | undefined>();
    expectTypeOf<PaginationProps["variant"]>().toEqualTypeOf<"default" | "outline" | undefined>();

    // Test that slot functions are available
    expectTypeOf(pagination).toHaveProperty("item");
    expectTypeOf(pagination).toHaveProperty("next");
    expectTypeOf(pagination).toHaveProperty("prev");

    // Test slot function return type
    const itemResult = pagination.item();

    expectTypeOf(itemResult).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for alert component with createTV factory in real usage", () => {
    // Real-world theme configuration
    const createThemeTV = createTV({
      twMergeConfig: {
        extend: {
          classGroups: {
            "font-size": [{ text: ["xs", "sm", "base", "lg", "xl", "2xl"] }],
          },
        },
      },
    });

    // Real-world alert component using the theme
    const alertVariants = createThemeTV({
      base: "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
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

    // Real-world usage: When a developer calls this function, TypeScript should infer the correct types
    const alert = alertVariants({ variant: "destructive" });

    // Test that VariantProps correctly extracts the parameter types
    type AlertProps = VariantProps<typeof alertVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<AlertProps["variant"]>().toEqualTypeOf<"default" | "destructive" | undefined>();

    // Test that the function can be called and returns a value
    expectTypeOf(alert).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for complex component with multi-level extends in real usage", () => {
    // Real-world base component
    const baseVariants = tv({
      base: "base-class",
      defaultVariants: {
        size: "default",
      },
      variants: {
        size: {
          default: "size-default",
          lg: "size-lg",
        },
      },
    });

    // Real-world intermediate component
    const intermediateVariants = tv({
      extend: baseVariants,
      variants: {
        color: {
          primary: "color-primary",
          secondary: "color-secondary",
        },
      },
    });

    // Real-world final component
    const finalVariants = tv({
      extend: intermediateVariants,
      variants: {
        weight: {
          bold: "weight-bold",
          normal: "weight-normal",
        },
      },
    });

    // Real-world usage: When a developer calls this function, TypeScript should infer the correct types
    const component = finalVariants({
      color: "primary",
      size: "lg",
      weight: "bold",
    });

    // Test that VariantProps correctly extracts the parameter types
    type FinalProps = VariantProps<typeof finalVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<FinalProps["size"]>().toEqualTypeOf<"default" | "lg" | undefined>();
    expectTypeOf<FinalProps["color"]>().toEqualTypeOf<"primary" | "secondary" | undefined>();
    expectTypeOf<FinalProps["weight"]>().toEqualTypeOf<"bold" | "normal" | undefined>();

    // Test that the function can be called and returns a value
    expectTypeOf(component).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for complex nested variants in real usage", () => {
    // Real-world complex component with nested variants
    const complexVariants = tv({
      base: "base-class",
      defaultVariants: {
        size: "default",
        theme: "light",
      },
      variants: {
        size: {
          default: "size-default",
          lg: "size-lg",
        },
        theme: {
          dark: {
            base: "theme-dark",
            content: "content-dark",
          },
          light: {
            base: "theme-light",
            content: "content-light",
          },
        },
      },
    });

    // Real-world usage: When a developer calls this function, TypeScript should infer the correct types
    const component = complexVariants({
      size: "lg",
      theme: "dark",
    });

    // Test that VariantProps correctly extracts the parameter types
    type ComplexProps = VariantProps<typeof complexVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<ComplexProps["size"]>().toEqualTypeOf<"default" | "lg" | undefined>();
    expectTypeOf<ComplexProps["theme"]>().toEqualTypeOf<"dark" | "light" | undefined>();

    // Test that the function can be called and returns a value
    expectTypeOf(component).toEqualTypeOf<string | undefined>();
  });

  // Additional real-world scenarios that were missing

  test("should infer types for components with no variants (base only)", () => {
    // Real-world simple component with only base class
    const simpleVariants = tv({
      base: "flex items-center justify-center rounded-md text-sm font-medium",
    });

    // Real-world usage
    const simple = simpleVariants();

    // Test that VariantProps correctly extracts the parameter types
    type SimpleProps = VariantProps<typeof simpleVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<SimpleProps["class"]>().toEqualTypeOf<ClassValue>();

    // Test that the function can be called and returns a value
    expectTypeOf(simple).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for components with only defaultVariants", () => {
    // Real-world component with only defaultVariants
    const defaultOnlyVariants = tv({
      base: "flex items-center",
      defaultVariants: {
        size: "default",
      },
      variants: {
        size: {
          default: "h-10",
          lg: "h-12",
        },
      },
    });

    // Real-world usage
    const defaultOnly = defaultOnlyVariants();

    // Test that VariantProps correctly extracts the parameter types
    type DefaultOnlyProps = VariantProps<typeof defaultOnlyVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<DefaultOnlyProps["size"]>().toEqualTypeOf<"default" | "lg" | undefined>();
    expectTypeOf<DefaultOnlyProps["class"]>().toEqualTypeOf<ClassValue>();

    // Test that the function can be called and returns a value
    expectTypeOf(defaultOnly).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for components with number variants", () => {
    // Real-world component with number variants
    const numberVariants = tv({
      base: "flex",
      variants: {
        columns: {
          1: "grid-cols-1",
          2: "grid-cols-2",
          3: "grid-cols-3",
          4: "grid-cols-4",
        },
        gap: {
          0: "gap-0",
          1: "gap-1",
          2: "gap-2",
          4: "gap-4",
        },
      },
    });

    // Real-world usage
    const number = numberVariants({ columns: 2, gap: 4 });

    // Test that VariantProps correctly extracts the parameter types
    type NumberProps = VariantProps<typeof numberVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<NumberProps["columns"]>().toEqualTypeOf<1 | 2 | 3 | 4 | undefined>();
    expectTypeOf<NumberProps["gap"]>().toEqualTypeOf<0 | 1 | 2 | 4 | undefined>();

    // Test that the function can be called and returns a value
    expectTypeOf(number).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for components with mixed variant types", () => {
    // Real-world component with mixed variant types
    const mixedVariants = tv({
      base: "flex",
      variants: {
        color: {
          primary: "text-blue-600",
          secondary: "text-gray-600",
          success: "text-green-600",
        },
        disabled: {
          false: "opacity-100",
          true: "opacity-50",
        },
        size: {
          lg: "text-lg",
          md: "text-base",
          sm: "text-sm",
        },
      },
    });

    // Real-world usage
    const mixed = mixedVariants({ color: "primary", disabled: true, size: "md" });

    // Test that VariantProps correctly extracts the parameter types
    type MixedProps = VariantProps<typeof mixedVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<MixedProps["size"]>().toEqualTypeOf<"lg" | "md" | "sm" | undefined>();
    expectTypeOf<MixedProps["disabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<MixedProps["color"]>().toEqualTypeOf<
      "primary" | "secondary" | "success" | undefined
    >();

    // Test that the function can be called and returns a value
    expectTypeOf(mixed).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for components with conditional variants", () => {
    // Real-world component with conditional variants
    const conditionalVariants = tv({
      base: "flex",
      compoundVariants: [
        {
          class: "font-bold",
          intent: "primary",
          size: "large",
        },
        {
          class: "border border-red-300",
          intent: "danger",
          size: "small",
        },
      ],
      variants: {
        intent: {
          danger: "bg-red-500 text-white",
          primary: "bg-blue-500 text-white",
          secondary: "bg-gray-500 text-white",
        },
        size: {
          large: "px-6 py-3 text-base",
          medium: "px-4 py-2 text-sm",
          small: "px-2 py-1 text-xs",
        },
      },
    });

    // Real-world usage
    const conditional = conditionalVariants({ intent: "primary", size: "large" });

    // Test that VariantProps correctly extracts the parameter types
    type ConditionalProps = VariantProps<typeof conditionalVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<ConditionalProps["intent"]>().toEqualTypeOf<
      "danger" | "primary" | "secondary" | undefined
    >();
    expectTypeOf<ConditionalProps["size"]>().toEqualTypeOf<
      "large" | "medium" | "small" | undefined
    >();

    // Test that the function can be called and returns a value
    expectTypeOf(conditional).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for components with custom class prop", () => {
    // Real-world component with custom class handling
    const customClassVariants = tv({
      base: "flex items-center",
      variants: {
        variant: {
          default: "bg-gray-100",
          primary: "bg-blue-100",
        },
      },
    });

    // Real-world usage with custom class
    const customClass = customClassVariants({
      class: "w-full rounded-lg",
      variant: "primary",
    });

    // Test that VariantProps correctly extracts the parameter types
    type CustomClassProps = VariantProps<typeof customClassVariants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<CustomClassProps["variant"]>().toEqualTypeOf<"default" | "primary" | undefined>();
    expectTypeOf<CustomClassProps["class"]>().toEqualTypeOf<ClassValue>();

    // Test that the function can be called and returns a value
    expectTypeOf(customClass).toEqualTypeOf<string | undefined>();
  });

  test("should infer types for components with deeply nested extends", () => {
    // Real-world deeply nested component hierarchy
    const level1Variants = tv({
      base: "base-level1",
      variants: {
        level1: {
          a: "level1-a",
          b: "level1-b",
        },
      },
    });

    const level2Variants = tv({
      extend: level1Variants,
      variants: {
        level2: {
          x: "level2-x",
          y: "level2-y",
        },
      },
    });

    const level3Variants = tv({
      extend: level2Variants,
      variants: {
        level3: {
          alpha: "level3-alpha",
          beta: "level3-beta",
        },
      },
    });

    const level4Variants = tv({
      extend: level3Variants,
      variants: {
        level4: {
          one: "level4-one",
          two: "level4-two",
        },
      },
    });

    // Real-world usage
    const deep = level4Variants({
      level1: "a",
      level2: "x",
      level3: "alpha",
      level4: "one",
    });

    // Test that VariantProps correctly extracts the parameter types
    type DeepProps = VariantProps<typeof level4Variants>;

    // These should work in real-world usage - if they don't, the library is broken
    expectTypeOf<DeepProps["level1"]>().toEqualTypeOf<"a" | "b" | undefined>();
    expectTypeOf<DeepProps["level2"]>().toEqualTypeOf<"x" | "y" | undefined>();
    expectTypeOf<DeepProps["level3"]>().toEqualTypeOf<"alpha" | "beta" | undefined>();
    expectTypeOf<DeepProps["level4"]>().toEqualTypeOf<"one" | "two" | undefined>();

    // Test that the function can be called and returns a value
    expectTypeOf(deep).toEqualTypeOf<string | undefined>();
  });
});
