import type { Config, TV } from "@/types";
import { mergeObjects } from "@/utils";
import { tv } from "@/core/tv";

export const createTV = (configProp: Config): TV => {
  return (options, config) => tv(options, config ? mergeObjects(configProp, config) : configProp);
};
