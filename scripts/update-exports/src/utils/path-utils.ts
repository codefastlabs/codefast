/**
 * Chuyển đổi tên thành kebab case cho đường dẫn export
 */
export function toKebabCase(str: string): string {
  return str
    .replaceAll(/(?<temp1>[a-z])(?<temp2>[A-Z])/g, "$1-$2")
    .replaceAll(/(?<temp1>[A-Z])(?<temp2>[A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/**
 * Tạo export path dựa trên đường dẫn import
 */
export function createExportPath(importPath: string): string {
  // Chuẩn hóa @/ thành ./
  let normalizedPath = importPath;

  if (importPath.startsWith("@/")) {
    normalizedPath = `./${importPath.slice(2)}`;
  }

  normalizedPath = normalizedPath.startsWith("./") ? normalizedPath.slice(2) : normalizedPath;

  const parts = normalizedPath.split("/").filter(Boolean);

  if (parts.length === 1) {
    return `./${toKebabCase(parts[0])}`;
  } else if (parts.length === 2) {
    const [dir, name] = parts;

    return `./${dir}/${toKebabCase(name)}`;
  }

  const lastIndex = parts.length - 1;

  parts[lastIndex] = toKebabCase(parts[lastIndex]);

  return `./${parts.join("/")}`;
}

/**
 * Deep merge hai object
 */
export function mergeDeep(target: any, source: any): any {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    for (const key of Object.keys(source)) {
      if (isObject(source[key])) {
        if (key in target) {
          output[key] = mergeDeep(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    }
  }

  return output;
}

/**
 * Kiểm tra xem một giá trị có phải là object không
 */
function isObject(item: any): boolean {
  return item && typeof item === "object" && !Array.isArray(item);
}
