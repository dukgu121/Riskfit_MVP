import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names with `clsx` and dedupe conflicting Tailwind utilities
 * via `tailwind-merge`. Use everywhere instead of raw string concatenation.
 *
 * @example
 *   cn("px-4 py-2", isActive && "bg-brand-500 text-white", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
