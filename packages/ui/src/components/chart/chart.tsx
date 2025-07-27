"use client";

import type { ComponentProps, ComponentType, CSSProperties, JSX, ReactNode } from "react";
import type { NameType, Payload, ValueType } from "recharts/types/component/DefaultTooltipContent";

import { useId, useMemo } from "react";
import * as RechartsPrimitive from "recharts";

import type { Scope } from "@radix-ui/react-context";

import { cn } from "@/lib/utils";
import { createContextScope } from "@radix-ui/react-context";

/* -----------------------------------------------------------------------------
 * Type Definitions and Utilities
 * -------------------------------------------------------------------------- */

type ExtractProps<T> = T extends (props: infer P) => ReactNode ? P : never;

type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/* -----------------------------------------------------------------------------
 * Chart Configuration and Theme Constants
 * --------------------------------------------------------------------------- */

const THEMES = { dark: ".dark", light: "" } as const;

type ChartConfig = Record<
  string,
  {
    label?: ReactNode;
    icon?: ComponentType;
  } & (
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
    | { color?: string; theme?: never }
  )
>;

/* -----------------------------------------------------------------------------
 * Context: ChartProvider
 * --------------------------------------------------------------------------- */

const CHART_PROVIDER_NAME = "ChartProvider";

type ScopedProps<P> = P & { __scopeChart?: Scope };

/**
 * Value provided by Chart Context
 */
interface ChartContextValue {
  /** Display configuration for the chart */
  config: ChartConfig;
}

const [createChartContext, createChartScope] = createContextScope(CHART_PROVIDER_NAME);

const [ChartContextProvider, useChartContext] =
  createChartContext<ChartContextValue>(CHART_PROVIDER_NAME);

/* -----------------------------------------------------------------------------
 * Component: Chart
 * -------------------------------------------------------------------------- */

interface ChartContainerProps extends ComponentProps<"div"> {
  children: ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  config: ChartConfig;
}

function ChartContainer({
  __scopeChart,
  children,
  className,
  config,
  id,
  ...props
}: ScopedProps<ChartContainerProps>): JSX.Element {
  const uniqueId = useId();
  const chartId = `chart-${id ?? uniqueId}`;

  return (
    <ChartContextProvider config={config} scope={__scopeChart}>
      <div
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-sector[stroke='#fff']]:stroke-transparent",
          className,
        )}
        data-chart={chartId}
        data-slot="chart"
        {...props}
      >
        <ChartStyle config={config} id={chartId} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContextProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ChartStyle
 * -------------------------------------------------------------------------- */

interface ChartStyleProps {
  config: ChartConfig;
  id: string;
}

function ChartStyle({ config, id }: ChartStyleProps): ReactNode {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.theme ?? itemConfig.color,
  );

  if (colorConfig.length === 0) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: generateChartStyles(id, colorConfig),
      }}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ChartTooltip
 * -------------------------------------------------------------------------- */

type ChartTooltipProps<TValue extends ValueType, TName extends NameType> = ComponentProps<
  typeof RechartsPrimitive.Tooltip<TValue, TName>
>;

const ChartTooltip = RechartsPrimitive.Tooltip;

/* -----------------------------------------------------------------------------
 * Component: ChartTooltipContent
 * -------------------------------------------------------------------------- */

const CHART_TOOLTIP_CONTENT_NAME = "ChartTooltipContent";

type ChartTooltipContentProps<TValue extends ValueType, TName extends NameType> = Omit<
  MakeOptional<
    ExtractProps<ComponentProps<typeof RechartsPrimitive.Tooltip<TValue, TName>>["content"]>,
    "accessibilityLayer" | "active" | "coordinate" | "payload"
  >,
  "payload"
> & {
  hideIndicator?: boolean;
  hideLabel?: boolean;
  indicator?: "dashed" | "dot" | "line";
  labelKey?: string;
  nameKey?: string;
  color?: string | undefined;
  className?: string | undefined;
  payload?: Payload<TValue, TName>[];
};

function ChartTooltipContent<TValue extends ValueType, TName extends NameType>({
  __scopeChart,
  active,
  className,
  color,
  formatter,
  hideIndicator = false,
  hideLabel = false,
  indicator = "dot",
  label,
  labelClassName,
  labelFormatter,
  labelKey,
  nameKey,
  payload = [],
}: ScopedProps<ChartTooltipContentProps<TValue, TName>>): ReactNode {
  const { config } = useChartContext(CHART_TOOLTIP_CONTENT_NAME, __scopeChart);

  const tooltipLabel = useMemo((): ReactNode => {
    if (hideLabel || payload.length === 0) {
      return null;
    }

    const [item] = payload;
    const key = safeToString(labelKey ?? item.dataKey ?? item.name ?? "value");
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === "string"
        ? label in config
          ? (config[label].label ?? label)
          : label
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

  if (!active || payload.length === 0) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {nestLabel ? null : tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = safeToString(nameKey ?? item.name ?? item.dataKey ?? "value");
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const indicatorColor =
            color ??
            (isRecord(item.payload) &&
            "fill" in item.payload &&
            typeof item.payload.fill === "string"
              ? item.payload.fill
              : undefined) ??
            item.color;

          return (
            <div
              key={key}
              className={cn(
                "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:size-2.5",
                indicator === "dot" && "items-center",
              )}
            >
              {formatter && item.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, [item])
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          "border-(--color-border) bg-(--color-bg) rounded-xs shrink-0",
                          {
                            "h-2.5 w-2.5": indicator === "dot",
                            "my-0.5": nestLabel && indicator === "dashed",
                            "w-0 border-[1.5px] border-dashed bg-transparent":
                              indicator === "dashed",
                            "w-1": indicator === "line",
                          },
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center",
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label ?? item.name}
                      </span>
                    </div>
                    {item.value != null && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {typeof item.value === "number"
                          ? item.value.toLocaleString()
                          : safeToString(item.value)}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ChartLegend
 * -------------------------------------------------------------------------- */

type ChartLegendProps = ComponentProps<typeof RechartsPrimitive.Legend>;

const ChartLegend = RechartsPrimitive.Legend;

/* -----------------------------------------------------------------------------
 * Component: ChartLegendContent
 * -------------------------------------------------------------------------- */

const CHART_LEGEND_CONTENT_NAME = "ChartLegendContent";

type ChartLegendContentProps = ComponentProps<"div"> &
  ExtractProps<RechartsPrimitive.LegendProps["content"]> & {
    hideIcon?: boolean;
    nameKey?: string;
  };

function ChartLegendContent({
  __scopeChart,
  className,
  hideIcon = false,
  nameKey,
  payload,
  verticalAlign = "bottom",
}: ScopedProps<ChartLegendContentProps>): ReactNode {
  const { config } = useChartContext(CHART_LEGEND_CONTENT_NAME, __scopeChart);

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {payload.map((item) => {
        let key = "value";

        if (nameKey) {
          key = nameKey;
        } else if (item.dataKey != null) {
          key = safeToString(item.dataKey);
        }

        const itemConfig = getPayloadConfigFromPayload(config, item, key);

        return (
          <div
            key={nameKey ? safeToString(itemConfig?.color ?? "") : safeToString(item.value ?? "")}
            className={cn("[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:size-3")}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="size-2 shrink-0 rounded-md"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>
        );
      })}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

/**
 * Type guard to check if an unknown value is a record with string keys
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Safely gets a string value from a record by key
 */
function getStringValue(record: Record<string, unknown>, key: string): string | undefined {
  if (key in record) {
    const value = record[key];

    return typeof value === "string" ? value : undefined;
  }

  return undefined;
}

/**
 * Safely converts a value to string without type coercion
 */
function safeToString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return value.toString();
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value.toString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "symbol") {
    return value.toString();
  }

  // For objects, arrays, functions, and other complex types, return empty string to avoid [object Object]
  return "";
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
): ChartConfig[string] | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  const payloadPayload = isRecord(payload.payload) ? payload.payload : undefined;
  let configLabelKey: string = key;

  // Try to get the config key from the payload first
  const payloadValue = getStringValue(payload, key);

  if (payloadValue) {
    configLabelKey = payloadValue;
  } else if (payloadPayload) {
    // If not found in the payload, try the nested payload
    const nestedValue = getStringValue(payloadPayload, key);

    if (nestedValue) {
      configLabelKey = nestedValue;
    }
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

/**
 * Generates CSS custom property for a specific theme and config item
 */
function generateCssVariable(
  key: string,
  itemConfig: ChartConfig[string],
  theme: string,
): null | string {
  const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ?? itemConfig.color;

  return color ? `  --color-${key}: ${color};` : null;
}

/**
 * Generates CSS rules for a specific theme
 */
function generateThemeStyles(
  theme: string,
  prefix: string,
  id: string,
  colorConfig: [string, ChartConfig[string]][],
): string {
  const cssVariables = colorConfig
    .map(([key, itemConfig]) => generateCssVariable(key, itemConfig, theme))
    .filter(Boolean)
    .join("\n");

  return `${prefix} [data-chart=${id}] {\n${cssVariables}\n}`;
}

/**
 * Generates complete CSS styles for all themes
 */
function generateChartStyles(id: string, colorConfig: [string, ChartConfig[string]][]): string {
  return Object.entries(THEMES)
    .map(([theme, prefix]) => generateThemeStyles(theme, prefix, id, colorConfig))
    .join("\n\n");
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  ChartConfig,
  ChartContainerProps,
  ChartLegendContentProps,
  ChartLegendProps,
  ChartStyleProps,
  ChartTooltipContentProps,
  ChartTooltipProps,
};

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  createChartScope,
};
