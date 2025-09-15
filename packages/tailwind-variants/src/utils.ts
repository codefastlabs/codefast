import type { ConfigExtension } from "tailwind-merge";

import { clsx } from "clsx";
import { extendTailwindMerge, twMerge } from "tailwind-merge";

import type {
  ClassValue,
  Configuration,
  ConfigurationSchema,
  ConfigurationWithSlots,
  ExtendedConfiguration,
  SlotConfigurationSchema,
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

export const hasSlotConfiguration = <
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema,
>(
  configuration: Configuration<T> | ConfigurationWithSlots<T, S>,
): configuration is ConfigurationWithSlots<T, S> => {
  return "slots" in configuration && configuration.slots !== undefined;
};

export const hasExtensionConfiguration = <
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema,
>(
  configuration:
    | Configuration<T>
    | ConfigurationWithSlots<T, S>
    | ExtendedConfiguration<ConfigurationSchema, T, SlotConfigurationSchema, S>,
): configuration is ExtendedConfiguration<ConfigurationSchema, T, SlotConfigurationSchema, S> => {
  return "extend" in configuration && configuration.extend !== undefined;
};
