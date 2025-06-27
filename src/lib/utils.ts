import type { MessageBag, FormValue, Path } from "../types";
import { coerceToArrayKey } from "./type-utils";

export const clamp = (min: number | null | undefined, max: number | null | undefined, val: number): number => {
  if (min != null) {
    val = Math.max(min, val);
  }
  if (max != null) {
    val = Math.min(max, val);
  }
  return val;
};

// Utility function for re-indexing error messages
export const reindexErrors = (
  errors: MessageBag,
  indexMap: (index: number) => number | undefined
): MessageBag => {
  const errorsCopy: MessageBag = {};
  for (const pathString in errors) {
    const path = pathString.split(".");
    const oldIndex = coerceToArrayKey(path[0]);
    if (oldIndex != null) {
      const newIndex = indexMap(oldIndex);
      if (newIndex == null) {
        continue;
      } else {
        path[0] = String(newIndex);
      }
    }
    errorsCopy[path.join(".")] = errors[pathString];
  }
  return errorsCopy;
};

export const startCase = (s: unknown): string => {
  return String(s)
    .trim()
    .replace(/_/g, " ")
    .replace(
      /\b\w+/g,
      (s) => s.charAt(0).toUpperCase() + s.substr(1).toLowerCase()
    );
};

export const valueAtPath = (value: FormValue, path: Path): FormValue => {
  let curr: FormValue = value;
  if (path.length == 0) {
    return curr;
  }
  for (const nextPart of path) {
    if (curr == null) {
      return undefined;
    }
    if (Array.isArray(curr)) {
      const index = coerceToArrayKey(nextPart);
      curr = index == null ? undefined : curr[index];
    } else if (
      typeof curr == "object" &&
      Object.prototype.hasOwnProperty.call(curr, nextPart)
    ) {
      curr = curr[nextPart];
    } else {
      return undefined;
    }
  }
  return curr;
};
