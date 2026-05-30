import type { MessageBag } from "../types";
import { coerceToArrayKey } from "./type-utils";

/**
 * Clone a MessageBag, copying each message array so the result can be mutated without
 * affecting the original.
 */
export const copyMessageBag = (bag: MessageBag): MessageBag => {
  const bagCopy: MessageBag = {};
  for (const key in bag) {
    bagCopy[key] = bag[key].slice();
  }
  return bagCopy;
};

/**
 * Extract the messages nested under `prefix`, with the prefix stripped from each key (the
 * key exactly equal to `prefix` becomes ""). An empty prefix returns a full copy. Used to
 * scope a parent's errors down to a child field/group.
 */
export const sliceMessageBag = (
  bag: MessageBag,
  prefix: string
): MessageBag => {
  if (prefix == "") {
    return copyMessageBag(bag);
  }
  const filtered: MessageBag = {};
  const prefixLength = prefix.length + 1;
  for (const path in bag) {
    if (path === prefix) {
      filtered[""] = bag[path];
    } else if (path.startsWith(prefix + ".")) {
      filtered[path.substring(prefixLength)] = bag[path];
    }
  }
  return filtered;
};

/**
 * Return a copy of `bag` with all messages under `prefix` replaced by `newSubBag` (re-prefixed).
 * Messages outside the prefix are preserved. The inverse of sliceMessageBag — used to merge a
 * child's updated errors back into the parent bag.
 */
export const spliceMessageBag = (
  bag: MessageBag,
  prefix: string,
  newSubBag: MessageBag
): MessageBag => {
  const bagCopy: MessageBag = {};
  if (prefix == "") {
    return copyMessageBag(newSubBag);
  }
  // make a copy of the errors
  for (const path in bag) {
    if (path === prefix || path.startsWith(prefix + ".")) {
      // skip
    } else {
      bagCopy[path] = bag[path];
    }
  }
  for (const path in newSubBag) {
    bagCopy[path == "" ? prefix : prefix + "." + path] = newSubBag[path];
  }
  return bagCopy;
};

/**
 * Render a MessageBag as a human-readable string — one "key: msg, msg" line per entry.
 */
export const messageBagToString = (bag: MessageBag): string => {
  return Object.entries(bag)
    .map(([key, msgs]) => {
      return key + ": " + msgs.join(", ");
    })
    .join("\n");
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
