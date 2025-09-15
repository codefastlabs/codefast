import type { ConfigExtension } from "tailwind-merge";

import { clsx } from "clsx";
import { extendTailwindMerge, twMerge } from "tailwind-merge";

import type {
  ClassValue,
  Config,
  ConfigSchema,
  ConfigWithSlots,
  ExtendedConfig,
  SlotSchema,
} from "@/types";

export const cx = (...classes: ClassValue[]): string => {
  return clsx(classes);
};

export const cn = (...classes: ClassValue[]): string => {
  return twMerge(clsx(classes));
};

export const createTailwindMerge = (
  config?: ConfigExtension<string, string>,
): ((classes: string) => string) => {
  return config ? extendTailwindMerge(config) : twMerge;
};

export const isSlotObject = (value: ClassValue): value is Record<string, ClassValue> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const isBooleanVariant = <T extends Record<string, unknown>>(
  variantGroup: T,
): variantGroup is T & (Record<"false", unknown> | Record<"true", unknown>) => {
  return "true" in variantGroup || "false" in variantGroup;
};

export const isBooleanValue = (value: unknown): value is boolean => {
  return typeof value === "boolean";
};

export const hasSlots = <T extends ConfigSchema, S extends SlotSchema>(
  config: Config<T> | ConfigWithSlots<T, S>,
): config is ConfigWithSlots<T, S> => {
  return "slots" in config && config.slots !== undefined;
};

export const hasExtend = <T extends ConfigSchema, S extends SlotSchema>(
  config: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
): config is ExtendedConfig<ConfigSchema, T, SlotSchema, S> => {
  return "extend" in config && config.extend !== undefined;
};
