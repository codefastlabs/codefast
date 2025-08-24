export const falsyToString = (value: unknown): boolean | number | string => {
  if (value === false) return "false";

  if (value === true) return "true";

  if (value === 0) return "0";

  return value as boolean | number | string;
};
