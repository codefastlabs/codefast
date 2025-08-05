import { z } from "zod";

const ComponentPathSchema = z
  .string()
  .min(1)
  .refine((path) => path.endsWith(".tsx") || path.endsWith(".ts"), {
    message: "Component path must end with .tsx or .ts",
  });

export class ComponentPath {
  private constructor(private readonly _value: string) {}

  static create(path: string): ComponentPath {
    const validatedPath = ComponentPathSchema.parse(path);

    return new ComponentPath(validatedPath);
  }

  get value(): string {
    return this._value;
  }

  get fileName(): string {
    return this._value.split("/").pop() || "";
  }

  get directory(): string {
    const parts = this._value.split("/");

    return parts.slice(0, -1).join("/");
  }

  get isTypeScriptReact(): boolean {
    return this._value.endsWith(".tsx");
  }

  get isTypeScript(): boolean {
    return this._value.endsWith(".ts");
  }

  equals(other: ComponentPath): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
