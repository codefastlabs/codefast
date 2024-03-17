import { twMerge } from "tailwind-merge";
import type { ClassValue} from "clsx";
import { clsx } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
