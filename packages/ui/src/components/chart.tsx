'use client';

import type { ComponentProps, ComponentType, CSSProperties, JSX, ReactNode } from 'react';
import type { NameType, Payload, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { createContext, useContext, useId, useMemo } from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/utils';

const THEMES = {
  dark: '.dark',
  light: '',
} as const;

type Theme = keyof typeof THEMES;

interface IconLabelConfig {
  icon?: ComponentType;
  label?: ReactNode | undefined;
}

interface ColorConfig {
  color?: string;
  theme?: never;
}

interface ThemeConfig {
  theme: Record<Theme, string>;
  color?: never;
}

type ChartConfigItem = (ColorConfig | ThemeConfig) & IconLabelConfig;

type ChartConfig = Record<string, ChartConfigItem | undefined>;

interface ChartContextProps {
  config: ChartConfig;
}

const ChartContext = createContext<ChartContextProps | null>(null);

function useChart(): ChartContextProps {
  const context = useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

/* -----------------------------------------------------------------------------
 * Component: Chart
 * -------------------------------------------------------------------------- */

interface ChartContainerProps extends ComponentProps<'div'> {
  children: ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
  config: ChartConfig;
}

function ChartContainer({ id, children, className, config, ...props }: ChartContainerProps): JSX.Element {
  const uniqueId = useId();
  const chartId = `chart-${id || uniqueId.replaceAll(':', '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          '[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-reference-line_]:stroke-border [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted flex aspect-video justify-center text-xs [&_.recharts-dot]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-sector]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none',
          className,
        )}
        data-chart={chartId}
        {...props}
      >
        <ChartStyle config={config} id={chartId} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ChartStyle
 * -------------------------------------------------------------------------- */

interface ChartStyleProps {
  config: ChartConfig;
  id: string;
}

function ChartStyle({ id, config }: ChartStyleProps): ReactNode {
  const cssString = useMemo(() => generateCSS(id, config), [id, config]);

  return <style dangerouslySetInnerHTML={{ __html: cssString }} />;
}

/* -----------------------------------------------------------------------------
 * Component: ChartTooltip
 * -------------------------------------------------------------------------- */

type ChartTooltipProps = ComponentProps<typeof RechartsPrimitive.Tooltip>;
const ChartTooltip = RechartsPrimitive.Tooltip;

/* -----------------------------------------------------------------------------
 * Component: ChartTooltipContent
 * -------------------------------------------------------------------------- */

interface ChartTooltipContentProps
  extends ComponentProps<typeof RechartsPrimitive.Tooltip>,
    Omit<ComponentProps<'div'>, 'content'> {
  hideIndicator?: boolean;
  hideLabel?: boolean;
  indicator?: 'dashed' | 'dot' | 'line';
  labelKey?: string;
  nameKey?: string;
}

function ChartTooltipContent({
  active,
  className,
  color,
  formatter,
  hideIndicator = false,
  hideLabel = false,
  indicator = 'dot',
  label,
  labelClassName,
  labelFormatter,
  labelKey,
  nameKey,
  payload,
}: ChartTooltipContentProps): ReactNode {
  const { config } = useChart();

  const tooltipLabel = useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;

    const key = `${labelKey || item.dataKey || item.name || 'value'}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value = !labelKey && typeof label === 'string' ? config[label]?.label || label : itemConfig?.label;

    if (labelFormatter) {
      return <div className={cn('font-medium', labelClassName)}>{labelFormatter(value, payload)}</div>;
    }

    if (!value) {
      return null;
    }

    return <div className={cn('font-medium', labelClassName)}>{value}</div>;
  }, [config, hideLabel, label, labelClassName, labelFormatter, labelKey, payload]);

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot';

  return (
    <div
      className={cn(
        'bg-background grid min-w-32 items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-lg',
        className,
      )}
    >
      {nestLabel ? null : tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || 'value'}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const indicatorColor = color || (item.payload as { fill?: string }).fill || item.color;

          return (
            <div
              key={item.dataKey}
              className={cn(
                '[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5',
                indicator === 'dot' && 'items-center',
              )}
            >
              {formatter && item.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload as Payload<ValueType, NameType>[])
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn('border-(--color-border) bg-(--color-bg) rounded-xs shrink-0', {
                          'h-2.5 w-2.5': indicator === 'dot',
                          'my-0.5': nestLabel && indicator === 'dashed',
                          'w-0 border border-dashed bg-transparent': indicator === 'dashed',
                          'w-1': indicator === 'line',
                        })}
                        style={
                          {
                            '--color-bg': indicatorColor,
                            '--color-border': indicatorColor,
                          } as CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn('flex flex-1 justify-between leading-none', nestLabel ? 'items-end' : 'items-center')}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">{itemConfig?.label || item.name}</span>
                    </div>
                    {item.value ? (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                    ) : null}
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

interface ChartLegendContentProps
  extends ComponentProps<'div'>,
    Pick<RechartsPrimitive.LegendProps, 'payload' | 'verticalAlign'> {
  hideIcon?: boolean;
  nameKey?: string;
}

function ChartLegendContent({
  className,
  hideIcon = false,
  nameKey,
  payload,
  verticalAlign = 'bottom',
}: ChartLegendContentProps): ReactNode {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div className={cn('flex items-center justify-center gap-4', verticalAlign === 'top' ? 'pb-3' : 'pt-3', className)}>
      {payload.map((item) => {
        let key = 'value';

        if (nameKey) {
          key = nameKey;
        } else if (item.dataKey) {
          key = String(item.dataKey);
        }

        const itemConfig = getPayloadConfigFromPayload(config, item, key);

        return (
          <div
            key={String(item.value)}
            className={cn('[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:size-3')}
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
 * Extracts and returns the appropriate configuration object from
 * the payload based on the specified key.
 *
 * @param config - The chart configuration object that contains various
 *   settings.
 * @param payload - The payload object that might contain nested payload data.
 * @param key - The key used to retrieve the specific configuration from the
 *   chart config.
 * @returns Returns a configuration object with optional properties `icon`,
 *   `label`, `color` or `theme`, or `undefined` if the payload is invalid or
 *   no configuration is found for the provided key.
 */
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string): ChartConfigItem | undefined {
  if (!isValidObject(payload)) {
    return undefined;
  }

  const nestedPayload = 'payload' in payload && isValidObject(payload.payload) ? payload.payload : undefined;

  const configLabelKey = getConfigLabelKey(payload, nestedPayload, key);

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

/**
 * Checks if the provided value is a valid object.
 *
 * @param obj - The value to check.
 * @returns - Returns true if the value is an object and not null, false
 *   otherwise.
 */
function isValidObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null;
}

/**
 * Retrieves the configuration label key from either the payload or
 * nestedPayload. If the key exists in the payload and is a string, the
 * corresponding value is returned. Otherwise, if the key exists in the
 * nestedPayload and is a string, its value is returned. If the key is not
 * found as a string in either object, the key itself is returned.
 *
 * @param payload - The primary payload containing key-value pairs.
 * @param nestedPayload - An optional nested payload containing additional
 *   key-value pairs.
 * @param key - The key to search for within the payload and nestedPayload.
 *
 * @returns The string value associated with the key if found; otherwise, the
 *   key itself.
 */
function getConfigLabelKey(
  payload: Record<string, unknown>,
  nestedPayload: Record<string, unknown> | undefined,
  key: string,
): string {
  if (key in payload && typeof payload[key] === 'string') {
    return payload[key];
  }

  if (nestedPayload && key in nestedPayload && typeof nestedPayload[key] === 'string') {
    return nestedPayload[key];
  }

  return key;
}

/**
 * Generates CSS for a specified theme and chart configuration.
 *
 * @param theme - The theme to be used (for example, 'light', 'dark').
 * @param id - The unique identifier of the chart.
 * @param configEntries - A list of configuration entries, each containing a
 *   key and a chart configuration.
 * @returns The generated CSS as a string.
 */
function generateThemeCSS(theme: Theme, id: string, configEntries: [string, ChartConfig[string]][]): string {
  const rules: string[] = [];

  rules.push(`${THEMES[theme]} [data-chart=${id}] {`);

  for (const [key, itemConfig] of configEntries) {
    const color = itemConfig?.theme?.[theme] || itemConfig?.color;

    if (color) {
      rules.push(`  --color-${key}: ${color};`);
    }
  }

  rules.push('}');

  return rules.join('\n');
}

/**
 * Generates CSS styles for a chart based on the provided configuration and
 * themes.
 *
 * @param id - The unique identifier for the chart element.
 * @param config - Configuration object for the chart. This includes theme and
 *   color settings.
 * @returns A string containing the generated CSS rules.
 */
function generateCSS(id: string, config: ChartConfig): string {
  const themeOrColorConfig = Object.entries(config).filter(([_, itemConfig]) => itemConfig?.theme || itemConfig?.color);

  const allRules: string[] = [];

  for (const theme of Object.keys(THEMES)) {
    const themeCSS = generateThemeCSS(theme as Theme, id, themeOrColorConfig);

    allRules.push(themeCSS);
  }

  return allRules.join('\n');
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
export { ChartContainer, ChartLegend, ChartLegendContent, ChartStyle, ChartTooltip, ChartTooltipContent };
