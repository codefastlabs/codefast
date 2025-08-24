export const isEmptyObject = (obj: unknown): boolean => {
  if (!obj || typeof obj !== "object") return true;

  for (const _ in obj as Record<string, unknown>) return false;

  return true;
};
