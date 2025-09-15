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

export const createTailwindMergeService = (
  configuration?: ConfigExtension<string, string>,
): ((classes: string) => string) => {
  return configuration ? extendTailwindMerge(configuration) : twMerge;
};

export const isSlotObjectType = (value: ClassValue): value is Record<string, ClassValue> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const isBooleanVariantType = <T extends Record<string, unknown>>(
  variantGroup: T,
): variantGroup is T & (Record<"false", unknown> | Record<"true", unknown>) => {
  return "true" in variantGroup || "false" in variantGroup;
};

export const isBooleanValueType = (value: unknown): value is boolean => {
  return typeof value === "boolean";
};

export const hasSlotConfiguration = <T extends ConfigSchema, S extends SlotSchema>(
  configuration: Config<T> | ConfigWithSlots<T, S>,
): configuration is ConfigWithSlots<T, S> => {
  return "slots" in configuration && configuration.slots !== undefined;
};

export const hasExtensionConfiguration = <T extends ConfigSchema, S extends SlotSchema>(
  configuration: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
): configuration is ExtendedConfig<ConfigSchema, T, SlotSchema, S> => {
  return "extend" in configuration && configuration.extend !== undefined;
};
