"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { createContextScope, type Scope } from "@radix-ui/react-context";
import { composeEventHandlers } from "@radix-ui/primitive";
import { cn } from "./utils";

type RemovedProps = "value" | "asChild" | "defaultChecked" | "defaultValue";

/* -----------------------------------------------------------------------------
 * Component: Segmented
 * -------------------------------------------------------------------------- */

const SEGMENTED_NAME = "Segmented";

type ScopedProps<P> = P & { __scopeSegmented?: Scope };

const [createSegmentedContext] = createContextScope(SEGMENTED_NAME);

interface Offset {
  left: number;
  top: number;
}

interface SegmentedContextValue {
  offset: Offset;
  setOffset: React.Dispatch<React.SetStateAction<Offset>>;
}

const [SegmentedProvider, useSegmentedContext] = createSegmentedContext<SegmentedContextValue>(SEGMENTED_NAME);

type SegmentedElement = React.ElementRef<typeof ToggleGroupPrimitive.Root>;
type SegmentedProps = Omit<
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>,
  RemovedProps | "disabled" | "type" | "onValueChange"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

const Segmented = React.forwardRef<SegmentedElement, SegmentedProps>(
  (
    {
      __scopeSegmented,
      children,
      className,
      value: valueProp,
      onValueChange: onValueChangeProp,
      defaultValue: defaultValueProp,
      ...props
    }: ScopedProps<SegmentedProps>,
    ref,
  ) => {
    const [value, setValue] = useControllableState({
      prop: valueProp,
      onChange: onValueChangeProp,
      defaultProp: defaultValueProp,
    });
    const childCount = React.Children.count(children);
    const [offset, setOffset] = React.useState<Offset>({
      left: 0,
      top: 0,
    });

    return (
      <SegmentedProvider scope={__scopeSegmented} offset={offset} setOffset={setOffset}>
        <ToggleGroupPrimitive.Root
          ref={ref}
          className={cn(
            "bg-background relative isolate inline-grid h-10 min-w-max auto-cols-fr grid-flow-col items-stretch rounded-md border text-center align-top shadow-sm",
            className,
          )}
          value={value}
          onValueChange={(valueChanged) => {
            if (valueChanged) {
              setValue(valueChanged);
            }
          }}
          type="single"
          {...props}
          style={
            {
              "--offset-left": `${offset.left.toString()}px`,
              "--offset-top": `${offset.top.toString()}px`,
              ...props.style,
            } as React.CSSProperties
          }
        >
          {children}
          <div
            className={cn(
              "pointer-events-none absolute -z-[1] h-full translate-x-[var(--offset-left)] transition-transform",
              "before:bg-accent before:absolute before:inset-0 before:rounded",
            )}
            style={
              {
                width: `calc(100% / ${childCount.toString()})`,
              } as React.CSSProperties
            }
          />
        </ToggleGroupPrimitive.Root>
      </SegmentedProvider>
    );
  },
);

Segmented.displayName = SEGMENTED_NAME;

/* -----------------------------------------------------------------------------
 * Component: SegmentedItem
 * -------------------------------------------------------------------------- */

const SEGMENTED_ITEM_NAME = "SegmentedItem";

type SegmentedItemElement = React.ElementRef<typeof ToggleGroupPrimitive.Item>;
type SegmentedItemProps = Omit<
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
  RemovedProps | "disabled" | "type"
> & {
  value: string;
};

const SegmentedItem = React.forwardRef<SegmentedItemElement, SegmentedItemProps>(
  ({ __scopeSegmented, children, className, onClick, ...props }: ScopedProps<SegmentedItemProps>, ref) => {
    const { setOffset } = useSegmentedContext(SEGMENTED_ITEM_NAME, __scopeSegmented);

    return (
      <ToggleGroupPrimitive.Item
        ref={ref}
        className={cn(
          "group flex select-none items-stretch rounded text-sm first:rounded-l-[inherit] [&:nth-last-child(2)]:rounded-r-[inherit]",
          "hover:bg-accent/30",
          "group-aria-checked:text-accent-foreground",
          className,
        )}
        onClick={composeEventHandlers(onClick, (event) => {
          setOffset({
            left: event.currentTarget.offsetLeft,
            top: event.currentTarget.offsetTop,
          });
        })}
        {...props}
      >
        {/* Separator */}
        <span
          className={cn(
            "bg-border my-1.5 w-px transition",
            "group-first:opacity-0",
            "group-[:where([data-state=on])+*]:opacity-0 group-aria-checked:opacity-0",
            "group-focus-visible:opacity-0 group-[&:focus-visible+*]:opacity-0",
            "group-[:where([data-state=on])+*]:scale-0 group-aria-checked:scale-0",
            "group-focus-visible:scale-0 group-[&:focus-visible+*]:scale-0",
          )}
        />
        {/* Label */}
        <span className="flex grow items-center justify-center gap-2 px-3 py-1 [&_svg]:shrink-0">
          {/* LabelActive */}
          <span className="font-medium opacity-0 transition-opacity group-aria-checked:opacity-100">{children}</span>
          {/* LabelInactive */}
          <span className="absolute opacity-100 transition-opacity group-aria-checked:opacity-0">{children}</span>
        </span>
      </ToggleGroupPrimitive.Item>
    );
  },
);

SegmentedItem.displayName = SEGMENTED_ITEM_NAME;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Segmented, SegmentedItem, type SegmentedProps, type SegmentedItemProps };
