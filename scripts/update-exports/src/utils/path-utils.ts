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
  // Bỏ './' prefix
  const normalizedPath = importPath.startsWith("./") ? importPath.slice(2) : importPath;

  // Phân tích đường dẫn
  const parts = normalizedPath.split("/");

  if (parts.length === 1) {
    // Trường hợp './SomeModule'
    return `./${toKebabCase(parts[0])}`;
  } else if (parts.length === 2) {
    // Trường hợp './dir/SomeModule'
    const [dir, name] = parts;

    // Nếu là thư mục components, giữ nguyên thư mục nhưng chuyển tên thành kebab case
    if (dir === "components") {
      return `./${toKebabCase(name)}`;
    }

    return `./${dir}/${toKebabCase(name)}`;
  }

  // Trường hợp './dir/subdir/Module'
  // Giữ nguyên 2 level đầu tiên và chuyển đổi tên cuối cùng
  const lastIndex = parts.length - 1;
  const lastPart = parts[lastIndex];

  parts[lastIndex] = toKebabCase(lastPart);

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
