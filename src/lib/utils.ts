import type { MessageBag, FormValue, Path } from "../types";
import { coerceToArrayKey } from "./type-utils";

/**
 * Constrain `val` to the inclusive range [min, max].
 * A null/undefined bound means "no limit" on that side.
 */
export const clamp = (min: number | null | undefined, max: number | null | undefined, val: number): number => {
  if (min != null) {
    val = Math.max(min, val);
  }
  if (max != null) {
    val = Math.min(max, val);
  }
  return val;
};

/**
 * Remap the leading array-index segment of each error path through `indexMap`.
 * Errors whose index maps to undefined are dropped; paths that don't begin with an
 * array index are passed through unchanged. Used to keep error paths aligned when a
 * repeater's rows are inserted, removed, or reordered.
 */
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

/**
 * Convert a value to Start Case: underscores become spaces and each word is capitalised
 * (with the remainder of the word lower-cased). Does not split camelCase or collapse runs
 * of whitespace. Typically used to derive a human label from a field name.
 */
export const startCase = (s: unknown): string => {
  return String(s)
    .trim()
    .replace(/_/g, " ")
    .replace(
      /\b\w+/g,
      (s) => s.charAt(0).toUpperCase() + s.substr(1).toLowerCase()
    );
};

/**
 * Walk `path` into a nested FormValue and return the value found there, or undefined if
 * any segment is missing. An empty path returns the value itself. Only own properties are
 * traversed (inherited members like `toString` are not followed).
 */
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
