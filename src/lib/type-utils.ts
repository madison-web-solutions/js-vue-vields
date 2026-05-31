import type {
  Loose,
  ScalarFormValue,
  KeyListFormValue,
  RepeaterFormValue,
  CompoundFormValue,
  FormValue,
  Path,
} from "../types";

export function mergeLoose<T>(defaults: T, overrides: Loose<T>): T {
  const result = {} as T;
  for (const key in defaults) {
    const value = overrides[key];
    result[key] = value ?? defaults[key];
  }
  return result;
};

/*** Type Checking functions ***/

export const isArrayKey = (key: unknown): boolean => {
  switch (typeof key) {
    case "number":
      return Number.isInteger(key) && key > -1;
    case "string": {
      const num = parseInt(key, 10);
      return String(num) === key && Number.isInteger(num) && num > -1;
    }
  }
  return false;
};

/*** Type Coercion functions ***/

export const coerceToArrayKey = (key: unknown): number | undefined => {
  switch (typeof key) {
    case "number":
      return Number.isInteger(key) && key > -1 ? key : undefined;
    case "string": {
      const num = parseInt(key, 10);
      return String(num) === key && Number.isInteger(num) && num > -1
        ? num
        : undefined;
    }
  }
  return undefined;
};

export const coerceToString = (value: unknown): string => {
  return value ? String(value) : "";
};

export const coerceToNumber = (value: unknown): number | null => {
  switch (typeof value) {
    case "number":
      return value;
    case "string":
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
  }
  return null;
};

export const coerceToBoolean = (value: unknown): boolean | null => {
  switch (typeof value) {
    case "boolean":
      return value;
    case "string":
      switch (value.toLowerCase()) {
        case "true":
        case "yes":
        case "on":
        case "t":
        case "y":
        case "1":
          return true;
        case "false":
        case "no":
        case "off":
        case "f":
        case "n":
        case "0":
          return false;
      }
      return null;
    case "number":
      if (value === 1) {
        return true;
      }
      if (value === 0) {
        return false;
      }
      return null;
  }
  return null;
};

export const coerceToBooleansNativeMap = (value: any): Map<string | number, boolean> => {
  const out: Map<string | number, boolean> = new Map();
  switch (typeof value) {
    case "string":
    case "number":
      out.set(value, true);
      break;
    case "object":
      if (value == null) {
        // nothing
      } else if (Array.isArray(value)) {
        value.forEach((subVal) => {
          if (typeof subVal == "string" || typeof subVal == "number") {
            out.set(subVal, true);
          }
        });
      } else {
        for (const [key, subVal] of Object.entries(value)) {
          out.set(key, !!subVal);
        }
      }
      break;
  }
  return out;
};

export const coerceToScalarFormValue = (val: unknown): ScalarFormValue => {
  switch (typeof val) {
    case "number":
    case "string":
    case "boolean":
    case "undefined":
      return val;
    case "object":
      if (val == null) {
        return null;
      } else {
        return JSON.stringify(val);
      }
  }
  return String(val);
};

export const coerceToKeyListFormValue = (val: unknown): KeyListFormValue => {
  switch (typeof val) {
    case "number":
    case "string":
      return [val];
    case "object":
      if (val == null) {
        return [];
      } else if (Array.isArray(val)) {
        const out: KeyListFormValue = [];
        for (const subVal of val) {
          const key = coerceToScalarFormValue(subVal);
          if (typeof key == "string" || typeof key == "number") {
            if (!out.includes(key)) {
              out.push(key);
            }
          }
        }
        return out;
      } else {
        const out: KeyListFormValue = [];
        for (const [subKey, subVal] of Object.entries(val)) {
          if (subVal) {
            out.push(subKey);
          }
        }
        return out;
      }
  }
  // undefined, boolean
  return [];
};

export const coerceToRepeaterFormValue = (val: unknown): RepeaterFormValue => {
  if (Array.isArray(val)) {
    return val.map(coerceToFormValue);
  } else {
    return [];
  }
};

export const coerceToCompoundFormValue = (val: unknown): CompoundFormValue => {
  if (val == null) {
    return {};
  } else if (typeof val === "object") {
    const coercedVals: CompoundFormValue = {};
    for (const [key, subVal] of Object.entries(val)) {
      coercedVals[key] = coerceToFormValue(subVal);
    }
    return coercedVals;
  } else {
    return {};
  }
};

export const coerceToFormValue = (val: unknown): FormValue => {
  switch (typeof val) {
    case "number":
    case "string":
    case "boolean":
    case "undefined":
      return val;
    case "object":
      if (val == null) {
        return null;
      } else if (Array.isArray(val)) {
        return val.map(coerceToFormValue);
      } else {
        const coercedVals: CompoundFormValue = {};
        for (const [key, subVal] of Object.entries(val)) {
          coercedVals[key] = coerceToFormValue(subVal);
        }
        return coercedVals;
      }
  }
  return undefined;
};

/*** Copying functions ***/

export const copyCompoundFormValue = (
  val: CompoundFormValue
): CompoundFormValue => {
  const mappedVals: CompoundFormValue = {};
  for (const key in val) {
    mappedVals[key] = copyFormValue(val[key]);
  }
  return mappedVals;
};

export const copyRepeaterFormValue = (
  val: RepeaterFormValue
): RepeaterFormValue => {
  return val.map((subVal) => copyFormValue(subVal));
};

export const copyKeyListFormValue = (
  val: KeyListFormValue
): KeyListFormValue => {
  return val.slice();
};

export const copyFormValue = (val: FormValue): FormValue => {
  if (val == null) {
    return val;
  } else if (Array.isArray(val)) {
    if (val.length == 0) {
      return [];
    } else if (typeof val[0] == "string" || typeof val[0] == "number") {
      return copyKeyListFormValue(val as KeyListFormValue);
    } else {
      return copyRepeaterFormValue(val as RepeaterFormValue);
    }
  } else if (typeof val == "object") {
    return copyCompoundFormValue(val);
  } else {
    return val;
  }
};

/*** Path traversal ***/

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

/**
 * Read the value at a single object key (a string) or array index (a number). The type of
 * `nameOrIndex` selects the container kind: a string addresses an object property, a number
 * an array index. Any other pairing (string into an array, number into an object, either
 * into a scalar/null) is a mis-keyed field and yields undefined.
 *
 * This is the single-level read every field does into its parent's provided value. For a
 * multi-segment relative query (a dotted path), use valueAtPath instead.
 */
export const valueAt = (
  container: FormValue,
  nameOrIndex: string | number
): FormValue => {
  if (typeof nameOrIndex == "number") {
    return Array.isArray(container) ? container[nameOrIndex] : undefined;
  }
  return container != null &&
    typeof container == "object" &&
    !Array.isArray(container) &&
    Object.prototype.hasOwnProperty.call(container, nameOrIndex)
    ? container[nameOrIndex]
    : undefined;
};

/**
 * Immutably set the value at a single object key (a string) or array index (a number),
 * returning a new container; the original is untouched. The type of `nameOrIndex` selects
 * the container kind (string ⟹ object, number ⟹ array).
 *  - number: the container must be an in-range array slot, otherwise it is returned
 *    unchanged — the guard against a stale write from a repeater row that has just been
 *    removed (a child can emit an update as it unmounts).
 *  - string: a key on an object. A null/undefined container is materialised as a fresh
 *    object; a non-null non-object (a type mismatch) is returned unchanged, not clobbered.
 */
export const setValueAt = (
  container: FormValue,
  nameOrIndex: string | number,
  value: FormValue
): FormValue => {
  if (typeof nameOrIndex == "number") {
    if (
      !Array.isArray(container) ||
      nameOrIndex < 0 ||
      nameOrIndex >= container.length
    ) {
      return container;
    }
    const copy = container.slice();
    copy[nameOrIndex] = value;
    return copy;
  }
  if (container == null) {
    return { [nameOrIndex]: value };
  }
  if (typeof container != "object" || Array.isArray(container)) {
    return container;
  }
  const obj: CompoundFormValue = { ...container };
  obj[nameOrIndex] = value;
  return obj;
};

/*** Immutable array operations ***/

const clampInsertIndex = (index: number, length: number): number => {
  return Math.max(0, Math.min(index, length));
};

/** A copy of `arr` with `value` inserted at `index` (clamped to [0, length]). */
export const arrayInsert = (
  arr: RepeaterFormValue,
  index: number,
  value: FormValue
): RepeaterFormValue => {
  const copy = arr.slice();
  copy.splice(clampInsertIndex(index, copy.length), 0, value);
  return copy;
};

/** A copy of `arr` with `value` appended. */
export const arrayAppend = (
  arr: RepeaterFormValue,
  value: FormValue
): RepeaterFormValue => {
  return arr.concat([value]);
};

/** A copy of `arr` with the item at `index` removed. An out-of-range index is a no-op. */
export const arrayRemove = (
  arr: RepeaterFormValue,
  index: number
): RepeaterFormValue => {
  if (index < 0 || index >= arr.length) {
    return arr.slice();
  }
  const copy = arr.slice();
  copy.splice(index, 1);
  return copy;
};

/** A copy of `arr` with the item at `from` moved to `to`. Out-of-range/equal is a no-op. */
export const arrayMove = (
  arr: RepeaterFormValue,
  from: number,
  to: number
): RepeaterFormValue => {
  if (
    from < 0 ||
    from >= arr.length ||
    to < 0 ||
    to >= arr.length ||
    from === to
  ) {
    return arr.slice();
  }
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

/** A copy of `arr` with the items at `i` and `j` swapped. Out-of-range/equal is a no-op. */
export const arraySwap = (
  arr: RepeaterFormValue,
  i: number,
  j: number
): RepeaterFormValue => {
  if (i < 0 || i >= arr.length || j < 0 || j >= arr.length || i === j) {
    return arr.slice();
  }
  const copy = arr.slice();
  const tmp = copy[i];
  copy[i] = copy[j];
  copy[j] = tmp;
  return copy;
};
