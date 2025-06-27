import type {
  Loose,
  ScalarFormValue,
  KeyListFormValue,
  RepeaterFormValue,
  CompoundFormValue,
  FormValue,
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

export const coerceToNumber = (value: unknown): number | undefined => {
  switch (typeof value) {
    case "number":
      return value;
    case "string":
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
  }
  return undefined;
};

export const coerceToBoolean = (value: unknown): boolean | undefined => {
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
      return undefined;
    case "number":
      if (value === 1) {
        return true;
      }
      if (value === 0) {
        return false;
      }
      return undefined;
  }
  return undefined;
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
