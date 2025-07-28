/**
 * FilePath Value Object
 *
 * Domain value object representing a file path with validation and business rules.
 * Immutable and contains path-related business logic.
 */

export class FilePath {
  private readonly _value: string;

  constructor(value: string) {
    if (!value.trim()) {
      throw new Error("File path cannot be empty");
    }

    if (value.includes("..")) {
      throw new Error("File path cannot contain relative path traversal");
    }

    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  get extension(): string {
    const lastDotIndex = this._value.lastIndexOf(".");

    return lastDotIndex === -1 ? "" : this._value.slice(lastDotIndex);
  }

  get fileName(): string {
    const lastSlashIndex = Math.max(this._value.lastIndexOf("/"), this._value.lastIndexOf("\\"));

    return lastSlashIndex === -1 ? this._value : this._value.slice(lastSlashIndex + 1);
  }

  get directory(): string {
    const lastSlashIndex = Math.max(this._value.lastIndexOf("/"), this._value.lastIndexOf("\\"));

    return lastSlashIndex === -1 ? "" : this._value.slice(0, lastSlashIndex);
  }

  isTypeScriptFile(): boolean {
    const extension = this.extension.toLowerCase();

    return extension === ".ts" || extension === ".tsx";
  }

  isJavaScriptFile(): boolean {
    const extension = this.extension.toLowerCase();

    return extension === ".js" || extension === ".jsx";
  }

  equals(other: FilePath): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
